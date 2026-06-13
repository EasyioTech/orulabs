import type { AppEnv } from "../types/hono";
import { Hono, type Context } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import {
  signUp,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  guestLogin,
  getUser,
  createAndSendVerificationEmail,
  AuthError,
} from "../services/auth.service";
import { sendAccountDeletedEmail } from "../services/email.service";
import { verifyAccessToken } from "../auth/jwt";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { trainingParticipants, participantResponses, users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";

export const authRouter = new Hono<AppEnv>();

// ─── Refresh token cookie ────────────────────────────────────────────
// Refresh token lives in an httpOnly cookie so XSS can't read it from JS.
// Web (orulabs.in) and API (api.orulabs.in) share the registrable domain, so
// the cookie is same-site → SameSite=Lax is sent on cross-origin XHR to the API.
const REFRESH_COOKIE = "oruclass-refresh-token";
const REFRESH_COOKIE_PATH = "/api/auth";
const REFRESH_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 365d, matches refresh token TTL — stay logged in until manual logout
const IS_PROD = process.env.NODE_ENV === "production";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined; // e.g. ".orulabs.in" in prod

function setRefreshCookie(c: Context, refreshToken: string) {
  setCookie(c, REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "Lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE,
    domain: COOKIE_DOMAIN,
  });
}

function clearRefreshCookie(c: Context) {
  deleteCookie(c, REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH, domain: COOKIE_DOMAIN });
}

function readRefreshToken(c: Context): string | undefined {
  return getCookie(c, REFRESH_COOKIE);
}

function errorResponse(c: Context, err: unknown) {
  if (err instanceof AuthError) {
    const status = err.code === "USER_NOT_FOUND" || err.code === "INVALID_CREDENTIALS" ? 401
      : err.code === "USER_ALREADY_EXISTS" ? 409
      : err.code === "WEAK_PASSWORD" ? 422
      : err.code === "INVALID_TOKEN" || err.code === "INVALID_REFRESH_TOKEN" ? 401
      : err.code === "ACCOUNT_LOCKED" ? 429
      : 400;
    return c.json({ error: err.message, code: err.code }, status);
  }
  console.error("[auth]", err);
  return c.json({ error: "Internal server error" }, 500);
}

// ─── POST /signup ────────────────────────────────────────────────────

authRouter.post("/signup", async (c) => {
  try {
    const { email, password, name, returnTo } = await c.req.json();
    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required." }, 400);
    }
    // Only allow same-origin redirects — reject absolute URLs to prevent open redirect
    const safeReturnTo = typeof returnTo === "string" && returnTo.startsWith("/") ? returnTo : undefined;
    const result = await signUp(email, password, name, safeReturnTo);
    setRefreshCookie(c, result.refreshToken);
    return c.json(result, 201);
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /login ─────────────────────────────────────────────────────

authRouter.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email and password are required." }, 400);
    }
    const result = await login(email, password);
    setRefreshCookie(c, result.refreshToken);
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /refresh ───────────────────────────────────────────────────

authRouter.post("/refresh", async (c) => {
  try {
    const refreshToken = readRefreshToken(c);
    if (!refreshToken) {
      return c.json({ error: "Refresh token is required." }, 400);
    }
    const result = await refreshAccessToken(refreshToken);
    setRefreshCookie(c, result.refreshToken);
    return c.json(result);
  } catch (err) {
    clearRefreshCookie(c);
    return errorResponse(c, err);
  }
});

// ─── POST /logout ────────────────────────────────────────────────────

authRouter.post("/logout", async (c) => {
  try {
    const refreshToken = readRefreshToken(c);
    if (refreshToken) {
      await logout(refreshToken);
    }
    clearRefreshCookie(c);
    return c.json({ success: true });
  } catch (err) {
    clearRefreshCookie(c);
    return errorResponse(c, err);
  }
});

// ─── POST /forgot-password ──────────────────────────────────────────

authRouter.post("/forgot-password", async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: "Email is required." }, 400);
    }
    await forgotPassword(email);
    // Always return success to prevent email enumeration
    return c.json({ success: true });
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /reset-password ───────────────────────────────────────────

authRouter.post("/reset-password", async (c) => {
  try {
    const { token, newPassword } = await c.req.json();
    if (!token || !newPassword) {
      return c.json({ error: "Token and new password are required." }, 400);
    }
    await resetPassword(token, newPassword);
    return c.json({ success: true });
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /verify-email ─────────────────────────────────────────────

authRouter.post("/verify-email", async (c) => {
  try {
    const { token, code, email } = await c.req.json();
    if (!token && (!code || !email)) {
      return c.json({ error: "Token or both code and email are required." }, 400);
    }
    const result = await verifyEmail({ token, code, email });
    setRefreshCookie(c, result.refreshToken);
    return c.json({ success: true, ...result });
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /resend-verification ──────────────────────────────────────

authRouter.post("/resend-verification", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Authentication required." }, 401);
    }
    
    // Parse JSON body to get returnTo, default to empty object if no body provided
    let returnTo: string | undefined;
    try {
      const body = await c.req.json();
      returnTo = body.returnTo;
    } catch {
      // Ignore JSON parse errors for empty bodies
    }

    const { userId, email } = await verifyAccessToken(authHeader.slice(7));
    const user = await getUser(userId);
    await createAndSendVerificationEmail(userId, email, user.name, returnTo);
    return c.json({ success: true });
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /guest ─────────────────────────────────────────────────────

authRouter.post("/guest", async (c) => {
  try {
    const { name } = await c.req.json();
    if (!name?.trim()) {
      return c.json({ error: "Name is required." }, 400);
    }
    const result = await guestLogin(name.trim());
    setRefreshCookie(c, result.refreshToken);
    return c.json(result, 201);
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── GET /me ─────────────────────────────────────────────────────────

authRouter.get("/me", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const { userId } = await verifyAccessToken(authHeader.slice(7));
    const user = await getUser(userId);
    return c.json({ user });
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

// ─── DELETE /me ──────────────────────────────────────────────────────

authRouter.delete("/me", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const user = await getUser(userId);
    // Delete user — cascades all owned workspaces, trainings, tokens, responses
    await db.delete(users).where(eq(users.id, userId));
    clearRefreshCookie(c);
    sendAccountDeletedEmail({ to: user.email, name: user.name }).catch(() => {});
    return c.json({ success: true });
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── GET /me/export ──────────────────────────────────────────────────
// DPDP Act 2023: right to access personal data

authRouter.get("/me/export", authMiddleware, async (c) => {
  try {
    const userId = c.get("userId");
    const user = await getUser(userId);
    const trainingsData = await db.query.trainings.findMany({
      where: (t, { eq }) => eq(t.createdBy, userId),
      columns: { id: true, title: true, sessionStatus: true, createdAt: true },
    });
    const participations = await db.query.trainingParticipants.findMany({
      where: (tp, { eq }) => eq(tp.userId, userId),
      with: { training: { columns: { id: true, title: true } } },
      columns: { joinedAt: true, connectionStatus: true },
    });
    const payload = {
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        emailVerified: user.emailVerified,
      },
      trainingsCreated: trainingsData,
      trainingsAttended: participations,
    };
    c.header("Content-Disposition", `attachment; filename="orulabs-data-export-${Date.now()}.json"`);
    c.header("Content-Type", "application/json");
    return c.body(JSON.stringify(payload, null, 2));
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ─── POST /upgrade-guest ─────────────────────────────────────────────
// Transfers a guest session's participant records + responses to the
// authenticated real user, then deletes the guest account.

authRouter.post("/upgrade-guest", authMiddleware, async (c) => {
  try {
    const { guestUserId } = await c.req.json();
    const realUserId = c.get("userId");

    if (!guestUserId || guestUserId === realUserId) {
      return c.json({ error: "Invalid guest user ID" }, 400);
    }

    const [guest] = await db.select({ id: users.id, isAnonymous: users.isAnonymous })
      .from(users).where(eq(users.id, guestUserId)).limit(1);

    if (!guest?.isAnonymous) {
      return c.json({ error: "Not a guest account" }, 400);
    }

    await db.transaction(async (tx) => {
      // Copy participant rows; skip trainings the real user already joined
      await tx.execute(sql`
        INSERT INTO training_participants
          (training_id, user_id, joined_at, connection_status, last_heartbeat, personal_notes, personal_whiteboard)
        SELECT training_id, ${realUserId}, joined_at, connection_status, last_heartbeat, personal_notes, personal_whiteboard
        FROM training_participants
        WHERE user_id = ${guestUserId}
        ON CONFLICT (training_id, user_id) DO NOTHING
      `);
      await tx.delete(trainingParticipants).where(eq(trainingParticipants.userId, guestUserId));

      // Transfer all responses (UUID PK — no conflicts)
      await tx.update(participantResponses)
        .set({ userId: realUserId })
        .where(eq(participantResponses.userId, guestUserId));

      // Remove the guest account
      await tx.delete(users).where(eq(users.id, guestUserId));
    });

    return c.json({ success: true });
  } catch (err) {
    return errorResponse(c, err);
  }
});
