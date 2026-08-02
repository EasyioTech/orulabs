import type { GrantablePermission, TrainingRole } from "@oruclass/types";
import { hasPermission } from "@oruclass/utils";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { liveSessions, liveSessionModuleStats, trainingFacilitators } from "../../db/schema";
import { SocketError } from "../lib/context";

export type ModuleStats = typeof liveSessionModuleStats.$inferSelect;
type StopwatchAction = "pause" | "resume" | "reset";

/** Stats row for a module within a live session, or undefined if none exists yet. */
export function getModuleStats(liveSessionId: string, moduleId: string): Promise<ModuleStats | undefined> {
  return db.query.liveSessionModuleStats.findFirst({
    where: and(
      eq(liveSessionModuleStats.liveSessionId, liveSessionId),
      eq(liveSessionModuleStats.moduleId, moduleId),
    ),
  });
}

/**
 * Applies a pause/resume/reset to the active module stopwatch. Authorization is
 * re-checked against the DB inside the tx (cached socket role can be stale after a
 * mid-session demotion), falling back to a session grant. Returns the updated stats
 * to broadcast, or undefined when there is nothing to do (no active session, no stats,
 * or a no-op action such as pausing an already-paused clock) — matching prior behavior.
 *
 * @throws SocketError FORBIDDEN when the caller may not control the stopwatch.
 */
export async function applyStopwatchAction(params: {
  trainingId: string;
  moduleId: string;
  userId: string;
  action: StopwatchAction;
  sessionGrants: GrantablePermission[];
}): Promise<ModuleStats | undefined> {
  const { trainingId, moduleId, userId, action, sessionGrants } = params;
  let result: ModuleStats | undefined;

  await db.transaction(async (tx) => {
    const facilitator = await tx.query.trainingFacilitators.findFirst({
      where: and(
        eq(trainingFacilitators.trainingId, trainingId),
        eq(trainingFacilitators.userId, userId),
      ),
    });
    const hasGrant = sessionGrants.includes("pause_room");
    if (!facilitator && !hasGrant) throw new SocketError("FORBIDDEN", "not authorized to control stopwatch");
    if (facilitator && !hasPermission(facilitator.role as TrainingRole, "pause_room") && !hasGrant) {
      throw new SocketError("FORBIDDEN", "not authorized to control stopwatch");
    }

    const liveSession = await tx.query.liveSessions.findFirst({
      where: and(eq(liveSessions.trainingId, trainingId), eq(liveSessions.status, "active")),
    });
    if (!liveSession) return;

    const stats = await tx.query.liveSessionModuleStats.findFirst({
      where: and(
        eq(liveSessionModuleStats.liveSessionId, liveSession.id),
        eq(liveSessionModuleStats.moduleId, moduleId),
      ),
    });
    if (!stats) return;

    if (action === "pause" && stats.isRunning) {
      const elapsedSeconds = Math.floor((Date.now() - stats.lastStartedAt.getTime()) / 1000);
      const updated = await tx.update(liveSessionModuleStats)
        .set({ isRunning: false, accumulatedSeconds: stats.accumulatedSeconds + elapsedSeconds, updatedAt: new Date() })
        .where(eq(liveSessionModuleStats.id, stats.id))
        .returning();
      result = updated[0];
    } else if (action === "resume" && !stats.isRunning) {
      const updated = await tx.update(liveSessionModuleStats)
        .set({ isRunning: true, lastStartedAt: new Date(), updatedAt: new Date() })
        .where(eq(liveSessionModuleStats.id, stats.id))
        .returning();
      result = updated[0];
    } else if (action === "reset") {
      const updated = await tx.update(liveSessionModuleStats)
        .set({ isRunning: false, accumulatedSeconds: 0, updatedAt: new Date() })
        .where(eq(liveSessionModuleStats.id, stats.id))
        .returning();
      result = updated[0];
    }
  });

  return result;
}
