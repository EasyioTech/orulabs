import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { users } from "../../db/schema";
import { USER_NAME_CACHE_TTL_MS, USER_NAME_CACHE_MAX } from "../../config/limits";

// Small in-process cache for socket-join user lookups. Avoids hammering the
// users table on every reconnect; TTL keeps profile edits visible within a minute.
const userCache = new Map<string, { name: string; expiresAt: number }>();

export async function getUserName(userId: string): Promise<string> {
  const now = Date.now();
  const hit = userCache.get(userId);
  if (hit && hit.expiresAt > now) return hit.name;
  const rec = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const name = rec?.name ?? "Unknown User";
  if (userCache.size >= USER_NAME_CACHE_MAX) {
    // Cheap FIFO eviction — Map preserves insertion order.
    const oldest = userCache.keys().next().value;
    if (oldest) userCache.delete(oldest);
  }
  userCache.set(userId, { name, expiresAt: now + USER_NAME_CACHE_TTL_MS });
  return name;
}
