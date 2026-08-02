import { StopwatchActionSchema } from "@oruclass/validators";
import { getGrants } from "../state";
import { applyStopwatchAction } from "../services/stopwatch.service";
import type { ConnContext } from "../lib/context";

export function registerStopwatchHandlers(ctx: ConnContext): void {
  const { io, userId, on } = ctx;

  on(
    "stopwatch:action",
    StopwatchActionSchema,
    async ({ trainingId, moduleId, action }) => {
      const sessionGrants = getGrants(trainingId, userId);
      const stopwatchData = await applyStopwatchAction({ trainingId, moduleId, userId, action, sessionGrants });

      // undefined = no-op (no active session, no stats, or already in target state).
      if (stopwatchData) {
        io.to(`training:${trainingId}`).emit("stopwatch:sync", {
          moduleId,
          accumulatedSeconds: stopwatchData.accumulatedSeconds,
          isRunning: stopwatchData.isRunning,
          lastStartedAt: stopwatchData.lastStartedAt.toISOString(),
        });
      }
    },
    { internalMessage: "failed to action stopwatch" },
  );
}
