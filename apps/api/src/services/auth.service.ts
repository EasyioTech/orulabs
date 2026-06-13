import { eq, and, gt } from "drizzle-orm";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { hashPassword, verifyPassword } from "../auth/password";
import { signAccessToken, signRefreshToken, getRefreshTokenExpiryDate, verifyRefreshToken } from "../auth/jwt";
import { recordFailedLogin, isLockedOut, clearLockout } from "../auth/lockout";
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendPasswordChangedEmail,
} from "./email.service";

const RAW_WEB_URL = process.env.WEB_URL ?? "http://localhost:3000";
const WEB_URL = RAW_WEB_URL.startsWith("http") ? RAW_WEB_URL.replace(/\/$/, "") : `https://${RAW_WEB_URL.replace(/\/$/, "")}`;

// Dev convenience: skip the verify-by-email step so you don't need a real inbox
// while developing. NEVER true in production — gated on NODE_ENV.
const SKIP_EMAIL_VERIFICATION =
  process.env.NODE_ENV !== "production" && process.env.SKIP_EMAIL_VERIFICATION === "true";

function generateToken(): string {
  return crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
}

// ─── Signup ──────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, name: string, returnTo?: string) {
  const existing = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing.length > 0) {
    throw new AuthError("USER_ALREADY_EXISTS", "An account with this email already exists.");
  }

  validatePassword(password);

  const hashed = await hashPassword(password);
  const [user] = await db.insert(schema.users).values({
    email,
    name,
    hashedPassword: hashed,
    emailVerified: SKIP_EMAIL_VERIFICATION,
    isAnonymous: false,
  }).returning();

  const tokens = await createTokenPair(user.id, user.email, user.emailVerified, user.isAnonymous);

  if (!SKIP_EMAIL_VERIFICATION) {
    // Only ONE email at signup: the verification email. Welcome is sent after they verify.
    createAndSendVerificationEmail(user.id, user.email, user.name, returnTo).catch(() => {});
  }

  return { user: sanitizeUser(user), ...tokens };
}

// ─── Login ───────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  if (await isLockedOut(email)) {
    throw new AuthError("ACCOUNT_LOCKED", "Too many failed attempts. Try again in 15 minutes.");
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user || !user.hashedPassword) {
    await recordFailedLogin(email);
    throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const valid = await verifyPassword(password, user.hashedPassword);
  if (!valid) {
    await recordFailedLogin(email);
    throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password.");
  }

  await clearLockout(email);
  const tokens = await createTokenPair(user.id, user.email, user.emailVerified, user.isAnonymous);
  return { user: sanitizeUser(user), ...tokens };
}

// ─── Refresh ─────────────────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string) {
  const [stored] = await db.select()
    .from(schema.refreshTokens)
    .where(and(eq(schema.refreshTokens.token, refreshToken), gt(schema.refreshTokens.expiresAt, new Date())))
    .limit(1);

  if (!stored) {
    throw new AuthError("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token.");
  }

  // Verify JWT integrity
  const { userId } = await verifyRefreshToken(refreshToken);

  // Rotate: delete old, create new
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, refreshToken));

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) {
    throw new AuthError("USER_NOT_FOUND", "User not found.");
  }

  const tokens = await createTokenPair(user.id, user.email, user.emailVerified, user.isAnonymous);
  return { user: sanitizeUser(user), ...tokens };
}

// ─── Logout ──────────────────────────────────────────────────────────

export async function logout(refreshToken: string) {
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.token, refreshToken));
}

// ─── Email Verification ──────────────────────────────────────────────

import crypto from "node:crypto";

export async function createAndSendVerificationEmail(userId: string, email: string, name: string, returnTo?: string) {
  // Dev bypass: mark verified instead of mailing a code. Covers signup + resend + any caller.
  if (SKIP_EMAIL_VERIFICATION) {
    await db.update(schema.users).set({ emailVerified: true }).where(eq(schema.users.id, userId));
    return;
  }
  // Clear old tokens for this user
  await db.delete(schema.emailVerificationTokens).where(eq(schema.emailVerificationTokens.userId, userId));

  const token = generateToken();
  const code = crypto.randomInt(100000, 1000000).toString(); // Secure 6-digit code
  
  await db.insert(schema.emailVerificationTokens).values({
    token,
    code,
    userId,
    email,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
  });

  let url = `${WEB_URL}/verify-email?token=${token}`;
  if (returnTo) url += `&returnTo=${encodeURIComponent(returnTo)}`;
  await sendVerificationEmail({ to: email, name, url, code });
}

export async function verifyEmail(payload: { token?: string, code?: string, email?: string }) {
  let record;
  
  if (payload.token) {
    [record] = await db.select()
      .from(schema.emailVerificationTokens)
      .where(and(eq(schema.emailVerificationTokens.token, payload.token), gt(schema.emailVerificationTokens.expiresAt, new Date())))
      .limit(1);
  } else if (payload.code && payload.email) {
    [record] = await db.select()
      .from(schema.emailVerificationTokens)
      .where(and(
        eq(schema.emailVerificationTokens.code, payload.code), 
        eq(schema.emailVerificationTokens.email, payload.email),
        gt(schema.emailVerificationTokens.expiresAt, new Date())
      ))
      .limit(1);
  } else {
    throw new AuthError("INVALID_TOKEN", "Provide either a token or an email and code.");
  }

  if (!record) {
    throw new AuthError("INVALID_TOKEN", "Invalid or expired verification code or token.");
  }

  await db.update(schema.users).set({ emailVerified: true }).where(eq(schema.users.id, record.userId));
  // Clean up all tokens for this user to prevent replay
  await db.delete(schema.emailVerificationTokens).where(eq(schema.emailVerificationTokens.userId, record.userId));

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, record.userId)).limit(1);
  if (!user) {
    throw new AuthError("USER_NOT_FOUND", "User not found.");
  }

  // Now that the account is verified, send the welcome email (single, separate from verification).
  sendWelcomeEmail({ to: user.email, name: user.name, loginUrl: WEB_URL }).catch(() => {});

  const tokens = await createTokenPair(user.id, user.email, user.emailVerified, user.isAnonymous);
  return { user: sanitizeUser(user), ...tokens };
}

// ─── Password Reset ─────────────────────────────────────────────────

export async function forgotPassword(email: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (!user) {
    // Don't reveal if email exists
    return;
  }

  // Clear old reset tokens
  await db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.userId, user.id));

  const token = generateToken();
  await db.insert(schema.passwordResetTokens).values({
    token,
    userId: user.id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
  });

  const url = `${WEB_URL}/reset-password?token=${token}`;
  await sendResetPasswordEmail({ to: user.email, name: user.name, url });
}

export async function resetPassword(token: string, newPassword: string) {
  validatePassword(newPassword);

  const [record] = await db.select()
    .from(schema.passwordResetTokens)
    .where(and(eq(schema.passwordResetTokens.token, token), gt(schema.passwordResetTokens.expiresAt, new Date())))
    .limit(1);

  if (!record) {
    throw new AuthError("INVALID_TOKEN", "Invalid or expired reset token.");
  }

  const hashed = await hashPassword(newPassword);
  await db.update(schema.users).set({ hashedPassword: hashed }).where(eq(schema.users.id, record.userId));
  await db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.userId, record.userId));

  // Revoke all refresh tokens (force re-login)
  await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.userId, record.userId));

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, record.userId)).limit(1);
  if (user) {
    sendPasswordChangedEmail({ to: user.email, name: user.name }).catch(() => {});
  }
}

// ─── Guest Login ─────────────────────────────────────────────────────

export async function guestLogin(name: string) {
  const guestEmail = `guest-${crypto.randomUUID().slice(0, 8)}@guest.oruclass.local`;

  const [user] = await db.insert(schema.users).values({
    email: guestEmail,
    name,
    isAnonymous: true,
    emailVerified: false,
  }).returning();

  const tokens = await createTokenPair(user.id, user.email, user.emailVerified, user.isAnonymous);
  return { user: sanitizeUser(user), ...tokens };
}

// ─── Get Current User ────────────────────────────────────────────────

export async function getUser(userId: string) {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!user) {
    throw new AuthError("USER_NOT_FOUND", "User not found.");
  }
  return sanitizeUser(user);
}

// ─── Helpers ─────────────────────────────────────────────────────────

async function createTokenPair(userId: string, email: string, emailVerified: boolean, isAnonymous: boolean) {
  const accessToken = await signAccessToken(userId, email, emailVerified, isAnonymous);
  const refreshToken = await signRefreshToken(userId);

  await db.insert(schema.refreshTokens).values({
    token: refreshToken,
    userId,
    expiresAt: getRefreshTokenExpiryDate(),
  });

  return { accessToken, refreshToken };
}

function sanitizeUser(user: typeof schema.users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
    createdAt: user.createdAt,
  };
}

function validatePassword(password: string) {
  if (password.length < 8) throw new AuthError("WEAK_PASSWORD", "Password must be at least 8 characters.");
  if (!/[A-Z]/.test(password)) throw new AuthError("WEAK_PASSWORD", "Password must contain an uppercase letter.");
  if (!/[a-z]/.test(password)) throw new AuthError("WEAK_PASSWORD", "Password must contain a lowercase letter.");
  if (!/\d/.test(password)) throw new AuthError("WEAK_PASSWORD", "Password must contain a number.");
}

// ─── Error Class ─────────────────────────────────────────────────────

export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
