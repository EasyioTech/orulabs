import { and, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { participantResponses, liveSessionModuleStats } from "../../db/schema";
import { getActiveLiveSessionId } from "../caches/live-session-cache";

/** The persisted answer payload — matches the responseData column's insert type. */
type ResponseData = typeof participantResponses.$inferInsert["responseData"];

/**
 * Persists a participant's answer for a module. Computes time-spent from the module
 * stopwatch (banked seconds + live elapsed if running) and stores it alongside the
 * response. A single upsert on (training, module, user) avoids the read-then-write
 * race that would let two near-simultaneous submissions create duplicate rows.
 */
export async function submitResponse(params: {
  trainingId: string;
  moduleId: string;
  userId: string;
  responseData: ResponseData;
}): Promise<void> {
  const { trainingId, moduleId, userId, responseData } = params;

  const liveSessionId = await getActiveLiveSessionId(trainingId);
  let timeSpentSeconds: number | null = null;

  if (liveSessionId) {
    const stats = await db.query.liveSessionModuleStats.findFirst({
      where: and(
        eq(liveSessionModuleStats.liveSessionId, liveSessionId),
        eq(liveSessionModuleStats.moduleId, moduleId),
      ),
    });
    if (stats) {
      const elapsedSeconds = stats.isRunning ? Math.floor((Date.now() - stats.lastStartedAt.getTime()) / 1000) : 0;
      timeSpentSeconds = stats.accumulatedSeconds + elapsedSeconds;
    }
  }

  await db
    .insert(participantResponses)
    .values({ trainingId, moduleId, userId, responseData, liveSessionId, timeSpentSeconds, startedAt: new Date() })
    .onConflictDoUpdate({
      target: [
        participantResponses.trainingId,
        participantResponses.moduleId,
        participantResponses.userId,
      ],
      set: { responseData, submittedAt: new Date(), liveSessionId, timeSpentSeconds },
    });
}
