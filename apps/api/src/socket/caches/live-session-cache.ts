import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { liveSessions } from "../../db/schema";

// Per-training liveSessionId cache. response:submit hits this on every
// answer, and the active liveSession only changes on session start/end/reset.
// 15s TTL bounds staleness; explicit busts on lifecycle events (see
// bustLiveSessionCache, called from the trainings routes) keep it tighter. Worst
// case without a bust: one stale submission gets a previous liveSessionId.
const liveSessionCache = new Map<string, { id: string | null; expiresAt: number }>();
const LIVE_SESSION_TTL_MS = 15_000;

export async function getActiveLiveSessionId(trainingId: string): Promise<string | null> {
  const now = Date.now();
  const hit = liveSessionCache.get(trainingId);
  if (hit && hit.expiresAt > now) return hit.id;
  const session = await db.query.liveSessions.findFirst({
    where: and(eq(liveSessions.trainingId, trainingId), eq(liveSessions.status, "active")),
    orderBy: [desc(liveSessions.startedAt)],
  });
  const id = session?.id ?? null;
  liveSessionCache.set(trainingId, { id, expiresAt: now + LIVE_SESSION_TTL_MS });
  return id;
}

export function bustLiveSessionCache(trainingId: string): void {
  liveSessionCache.delete(trainingId);
}
