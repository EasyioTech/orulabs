import type { MiddlewareHandler } from "hono";
import { verifyAccessToken } from "../auth/jwt";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized", code: "NO_TOKEN" }, 401);
  }

  try {
    const { userId, email, emailVerified, isAnonymous } = await verifyAccessToken(authHeader.slice(7));
    c.set("userId", userId);
    c.set("userEmail", email);

    if (!isAnonymous && !emailVerified) {
      return c.json({ error: "Email not verified", code: "EMAIL_NOT_VERIFIED" }, 403);
    }

    await next();
  } catch {
    return c.json({ error: "Unauthorized", code: "INVALID_TOKEN" }, 401);
  }
};
