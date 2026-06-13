import { SignJWT, jwtVerify } from "jose";

// Never silently fall back to a known secret in production — forged tokens
// would be trivially mintable. Fail fast at boot instead.
function resolveSecret(): string {
  const configured = process.env.JWT_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (configured && configured.length >= 32) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET (or BETTER_AUTH_SECRET) must be set to a value of at least 32 characters in production.",
    );
  }
  if (configured) {
    console.warn("[jwt] JWT secret is shorter than 32 chars — acceptable only in development.");
    return configured;
  }
  console.warn("[jwt] No JWT secret set — using insecure development fallback. Do NOT use in production.");
  return "dev-secret-change-me";
}

const secret = new TextEncoder().encode(resolveSecret());
const issuer = process.env.JWT_ISSUER ?? "oruclass-api";

const ACCESS_TOKEN_EXPIRY = "15m";
// Long-lived refresh so users stay logged in until they explicitly log out.
// Access tokens stay short (15m) and are renewed silently via the refresh cookie.
const REFRESH_TOKEN_EXPIRY = "365d";
const REFRESH_TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export async function signAccessToken(
  userId: string,
  email: string,
  emailVerified: boolean,
  isAnonymous: boolean,
): Promise<string> {
  return new SignJWT({ userId, email, emailVerified, isAnonymous })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secret);
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<{ userId: string; email: string; emailVerified: boolean; isAnonymous: boolean }> {
  const { payload } = await jwtVerify(token, secret, { issuer });
  return {
    userId: payload.userId as string,
    email: payload.email as string,
    emailVerified: payload.emailVerified as boolean,
    isAnonymous: payload.isAnonymous as boolean,
  };
}

export async function verifyRefreshToken(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, secret, { issuer });
  return { userId: payload.userId as string };
}

export function getRefreshTokenExpiryDate(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}
