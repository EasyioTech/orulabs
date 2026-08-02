import { and, count, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { participantResponses, trainingParticipants } from "../../db/schema";
import { logger } from "../../utils/logger";
import { getActiveLiveSessionId } from "../caches/live-session-cache";
import type { IO } from "./context";

// Coalesced aggregate broadcaster. A submission storm — 50 participants answering at
// once — would otherwise run one DB count + one room-wide broadcast PER submit. Since
// every broadcast fans out to every socket, that's O(N²) messages (50 submits × 50
// sockets = 2,500) plus N count queries per module, all within a couple hundred ms.
// Instead we debounce per (training, module): the first submit schedules a flush, the
// rest in the window just coalesce into it, and a single flush runs the counts once
// and broadcasts once. The live count lands within AGGREGATE_FLUSH_MS — imperceptible
// to the trainer — while messages drop from O(N²) to ~1 per window per module.
const AGGREGATE_FLUSH_MS = 300;
const pendingAggregates = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleAggregate(io: IO, trainingId: string, moduleId: string): void {
  const key = `${trainingId}:${moduleId}`;
  if (pendingAggregates.has(key)) return; // a flush is already queued for this module
  const timer = setTimeout(async () => {
    pendingAggregates.delete(key);
    try {
      const liveSessionId = await getActiveLiveSessionId(trainingId);
      const [respRow, partRow] = await Promise.all([
        db
          .select({ responseCount: count() })
          .from(participantResponses)
          .where(and(
            eq(participantResponses.trainingId, trainingId),
            eq(participantResponses.moduleId, moduleId),
          )),
        liveSessionId
          ? db
              .select({ participantCount: count() })
              .from(trainingParticipants)
              .where(eq(trainingParticipants.trainingId, trainingId))
          : Promise.resolve([{ participantCount: 0 }] as const),
      ]);
      const responseCount = respRow[0].responseCount;

      io.to(`training:${trainingId}`).emit("data:aggregate", {
        trainingId,
        moduleId,
        responseCount,
      });

      if (liveSessionId) {
        // Trainer-dashboard progress only — trainers sub-room, not the whole room.
        io.to(`training:${trainingId}:trainers`).emit("session:submission_update", {
          trainingId,
          moduleId,
          liveSessionId,
          submitted: Number(responseCount),
          totalParticipants: Number(partRow[0].participantCount),
        });
      }
    } catch (err) {
      logger.error(err, "aggregate flush failed");
    }
  }, AGGREGATE_FLUSH_MS);
  pendingAggregates.set(key, timer);
}
