import { ModuleUnlockSchema, ModuleSetTimeLimitSchema } from "@oruclass/validators";
import { getOrCreateState, getGrants, persistState } from "../state";
import { unlockModule, setModuleTimeLimit } from "../services/modules.service";
import type { ConnContext } from "../lib/context";

export function registerModuleHandlers(ctx: ConnContext): void {
  const { io, userId, on } = ctx;

  on(
    "module:unlock",
    ModuleUnlockSchema,
    async ({ trainingId, moduleId }) => {
      const state = getOrCreateState(trainingId);
      const prevModuleId = state.activeModuleId;
      const sessionGrants = getGrants(trainingId, userId);

      const { moduleData, stopwatchData } = await unlockModule({
        trainingId,
        moduleId,
        userId,
        sessionGrants,
        prevModuleId,
      });

      state.activeModuleId = moduleId;

      io.to(`training:${trainingId}`).emit("module:unlocked", { moduleId, module: moduleData });

      if (stopwatchData) {
        io.to(`training:${trainingId}`).emit("stopwatch:sync", {
          moduleId,
          accumulatedSeconds: stopwatchData.accumulatedSeconds,
          isRunning: stopwatchData.isRunning,
          lastStartedAt: stopwatchData.lastStartedAt.toISOString(),
        });
      }

      // Persist new active module to Redis for restart survivability.
      await persistState(trainingId);
    },
    { internalMessage: "failed to unlock module" },
  );

  on(
    "module:setTimeLimit",
    ModuleSetTimeLimitSchema,
    async ({ trainingId, moduleId, timeLimitSeconds }) => {
      const sessionGrants = getGrants(trainingId, userId);
      const moduleData = await setModuleTimeLimit({ trainingId, moduleId, userId, sessionGrants, timeLimitSeconds });

      // Re-broadcast the updated module so every client recomputes the countdown live.
      io.to(`training:${trainingId}`).emit("module:unlocked", { moduleId, module: moduleData });
    },
    { internalMessage: "failed to set time limit" },
  );
}
