import type { Context, Next } from "hono";
import { redis } from "../db/redis";
import { logger } from "../utils/logger";

// Distributed rate limiting backed by Redis so the cap is enforced across every API
// instance behind the load balancer — an in-process Map would let N nodes each grant
// the full quota, multiplying the real limit by N. Each limiter namespaces its own
// Redis key so an /api/auth/* hit is never double-counted against /api/*.
//
// Redis is the source of truth, but if it's unreachable we fall back to a per-process
// Map rather than fail the request — a packed venue must not be locked out by a Redis
// blip. The fallback is best-effort (per-node) but bounded.
function createLimiter(
  name: string,
  maxRequests: number,
  windowMs: number,
  opts: { skip?: (c: Context) => boolean } = {},
) {
  const fallbackBuckets = new Map<string, { count: number; resetAt: number }>();

  function fallbackCheck(ip: string): { limited: boolean; retryAfterMs: number } {
    const now = Date.now();
    const bucket = fallbackBuckets.get(ip);
    if (!bucket || now > bucket.resetAt) {
      fallbackBuckets.set(ip, { count: 1, resetAt: now + windowMs });
      return { limited: false, retryAfterMs: 0 };
    }
    bucket.count++;
    if (bucket.count > maxRequests) {
      return { limited: true, retryAfterMs: bucket.resetAt - now };
    }
    return { limited: false, retryAfterMs: 0 };
  }

  return async (c: Context, next: Next) => {
    if (opts.skip?.(c)) return next();
    const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

    let limited = false;
    let retryAfterMs = windowMs;

    if (redis.isOpen) {
      try {
        const key = `ratelimit:${name}:${ip}`;
        const count = await redis.incr(key);
        if (count === 1) {
          await redis.pExpire(key, windowMs);
        }
        if (count > maxRequests) {
          limited = true;
          const ttl = await redis.pTTL(key);
          retryAfterMs = ttl > 0 ? ttl : windowMs;
        }
      } catch (err) {
        logger.error(err, "Rate limiter Redis error — using in-process fallback");
        const r = fallbackCheck(ip);
        limited = r.limited;
        retryAfterMs = r.retryAfterMs;
      }
    } else {
      const r = fallbackCheck(ip);
      limited = r.limited;
      retryAfterMs = r.retryAfterMs;
    }

    if (limited) {
      c.header("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
      return c.json({ error: "Too many requests" }, 429);
    }

    return next();
  };
}

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

// Caps are env-tunable so a packed venue — a whole class behind one router/NAT, i.e.
// one shared public IP — can be accommodated at event time without a redeploy.
// Credential endpoints (login/signup/forgot/reset) stay capped to slow brute-force,
// but high enough that ~50 students on one shared IP can all authenticate.
export const authRateLimiter = createLimiter(
  "auth",
  num(process.env.AUTH_RATE_MAX, 120),
  num(process.env.AUTH_RATE_WINDOW_MS, 60_000),
  // Guest login has its own lenient limiter mounted ahead of this one; don't let
  // the strict credential limiter also count those requests.
  { skip: (c) => c.req.path === "/api/auth/guest" },
);

// Guest login is anonymous — no password to guess — so a roomful provisioning in a
// burst is normal usage, not abuse. Much higher cap, still bounded to stop a runaway
// client loop from creating unlimited accounts.
export const guestRateLimiter = createLimiter(
  "guest",
  num(process.env.GUEST_RATE_MAX, 400),
  num(process.env.GUEST_RATE_WINDOW_MS, 60_000),
);

// 50 participants each make several reads (join, fetch training, modules, roster) on
// the same shared IP, so the old 200 cap was far too low for one classroom.
export const apiRateLimiter = createLimiter(
  "api",
  num(process.env.API_RATE_MAX, 600),
  num(process.env.API_RATE_WINDOW_MS, 60_000),
);
