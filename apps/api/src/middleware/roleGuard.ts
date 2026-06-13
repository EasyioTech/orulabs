import type { MiddlewareHandler } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { trainingFacilitators } from "../db/schema";
import { hasPermission, type Permission } from "@oruclass/utils";
import type { TrainingRole } from "@oruclass/types";
import { ROLE_CACHE_TTL_MS } from "../config/limits";
import { redis } from "../db/redis";
import { logger } from "../utils/logger";

// Two-tier role cache. Tier 1 is a per-process Map for zero-latency hits within a node;
// tier 2 is Redis so the cache is shared and — critically — invalidation propagates to
// EVERY node. With only an in-process cache, revoking a facilitator on node A left
// node B serving the stale role for up to the TTL, a real authz gap. invalidateRoleCache
// now deletes the Redis key AND publishes an invalidation so peers drop their local copy.
const roleCache = new Map<string, { role: TrainingRole; expiresAt: number }>();
const ROLE_REDIS_KEY = (key: string) => `role:${key}`;
const ROLE_INVALIDATE_CHANNEL = "role:invalidate";
const NEG = "__none__"; // sentinel for "not a facilitator" so negatives are cached too

let subscribed = false;
async function ensureSubscribed(): Promise<void> {
  if (subscribed || !redis.isOpen) return;
  subscribed = true;
  try {
    // A dedicated subscriber connection — the shared client can't both subscribe and
    // run normal commands. Duplicate + connect lazily on first guard use.
    const sub = redis.duplicate();
    sub.on("error", (err) => logger.error(err, "Role invalidation subscriber error"));
    await sub.connect();
    await sub.subscribe(ROLE_INVALIDATE_CHANNEL, (key) => {
      roleCache.delete(key);
    });
  } catch (err) {
    subscribed = false;
    logger.error(err, "Role invalidation subscribe failed");
  }
}

async function getFacilitatorRole(userId: string, trainingId: string): Promise<TrainingRole | null> {
  const cacheKey = `${userId}:${trainingId}`;

  // Tier 1: in-process
  const cached = roleCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.role;

  void ensureSubscribed();

  // Tier 2: Redis (shared across nodes)
  if (redis.isOpen) {
    try {
      const fromRedis = await redis.get(ROLE_REDIS_KEY(cacheKey));
      if (fromRedis !== null) {
        if (fromRedis === NEG) return null;
        const role = fromRedis as TrainingRole;
        roleCache.set(cacheKey, { role, expiresAt: Date.now() + ROLE_CACHE_TTL_MS });
        return role;
      }
    } catch (err) {
      logger.error(err, "Role cache Redis read failed — falling through to DB");
    }
  }

  const facilitator = await db.query.trainingFacilitators.findFirst({
    where: and(
      eq(trainingFacilitators.trainingId, trainingId),
      eq(trainingFacilitators.userId, userId),
    ),
  });

  const ttlSec = Math.ceil(ROLE_CACHE_TTL_MS / 1000);

  if (!facilitator) {
    roleCache.delete(cacheKey);
    if (redis.isOpen) {
      redis.set(ROLE_REDIS_KEY(cacheKey), NEG, { EX: ttlSec }).catch(() => {});
    }
    return null;
  }

  const role = facilitator.role as TrainingRole;
  roleCache.set(cacheKey, { role, expiresAt: Date.now() + ROLE_CACHE_TTL_MS });
  if (redis.isOpen) {
    redis.set(ROLE_REDIS_KEY(cacheKey), role, { EX: ttlSec }).catch(() => {});
  }
  return role;
}

/** Call this when a facilitator's role changes to invalidate the cache on every node immediately. */
export function invalidateRoleCache(userId: string, trainingId: string): void {
  const cacheKey = `${userId}:${trainingId}`;
  roleCache.delete(cacheKey);
  if (redis.isOpen) {
    redis.del(ROLE_REDIS_KEY(cacheKey)).catch(() => {});
    redis.publish(ROLE_INVALIDATE_CHANNEL, cacheKey).catch(() => {});
  }
}

export function requireTrainingPermission(permission: Permission): MiddlewareHandler {
  return async (c, next) => {
    const userId = c.get("userId") as string;
    const trainingId = c.req.param("trainingId") ?? c.req.param("id");

    if (!trainingId) {
      return c.json({ error: "Training ID required", code: "NO_TRAINING_ID" }, 400);
    }

    const role = await getFacilitatorRole(userId, trainingId);

    if (!role) {
      return c.json({ error: "Forbidden", code: "NOT_FACILITATOR" }, 403);
    }

    if (!hasPermission(role, permission)) {
      return c.json({ error: "Insufficient permissions", code: "PERMISSION_DENIED" }, 403);
    }

    c.set("trainingRole", role);
    await next();
  };
}
