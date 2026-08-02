import type { GrantablePermission, TrainingRole } from "@oruclass/types";
import { hasPermission } from "@oruclass/utils";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { liveSessions, liveSessionModuleStats, trainingFacilitators, trainingModules, trainings } from "../../db/schema";
import { SocketError } from "../lib/context";
import type { ModuleStats } from "./stopwatch.service";

export type Module = typeof trainingModules.$inferSelect;

/** Module row by id only (no training scoping) — used for join-time restore. */
export function getModuleById(moduleId: string): Promise<Module | undefined> {
  return db.query.trainingModules.findFirst({ where: eq(trainingModules.id, moduleId) });
}

function assertCanUnlock(
  facilitator: { role: string } | undefined,
  sessionGrants: GrantablePermission[],
  message: string,
): void {
  const hasGrant = sessionGrants.includes("unlock_modules");
  if (!facilitator && !hasGrant) throw new SocketError("FORBIDDEN", message);
  if (facilitator && !hasPermission(facilitator.role as TrainingRole, "unlock_modules") && !hasGrant) {
    throw new SocketError("FORBIDDEN", message);
  }
}

/**
 * Unlocks a module and makes it the active one, atomically. All of the following
 * happen in a single tx so a race between two facilitators can't leave a half-applied
 * state: authorization re-check (DB role or session grant), module ownership check,
 * marking the module unlocked, pointing the training at it, pausing the previously
 * active module's stopwatch (banking its elapsed time), and starting/creating the new
 * module's stopwatch. Denials throw before any write, so the tx rolls back cleanly.
 *
 * @throws SocketError FORBIDDEN when unauthorized or the module doesn't belong here.
 */
export async function unlockModule(params: {
  trainingId: string;
  moduleId: string;
  userId: string;
  sessionGrants: GrantablePermission[];
  prevModuleId: string | null;
}): Promise<{ moduleData: Module; stopwatchData?: ModuleStats }> {
  const { trainingId, moduleId, userId, sessionGrants, prevModuleId } = params;
  let moduleData: Module | undefined;
  let stopwatchData: ModuleStats | undefined;

  await db.transaction(async (tx) => {
    const facilitator = await tx.query.trainingFacilitators.findFirst({
      where: and(
        eq(trainingFacilitators.trainingId, trainingId),
        eq(trainingFacilitators.userId, userId),
      ),
    });
    assertCanUnlock(facilitator, sessionGrants, "not authorized to unlock this module");

    // Confirm the module actually belongs to this training before unlocking.
    const mod = await tx.query.trainingModules.findFirst({
      where: and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)),
    });
    if (!mod) throw new SocketError("FORBIDDEN", "not authorized to unlock this module");

    await tx
      .update(trainingModules)
      .set({ isUnlocked: true, updatedAt: new Date() })
      .where(eq(trainingModules.id, moduleId));

    await tx
      .update(trainings)
      .set({ currentActiveModuleId: moduleId, updatedAt: new Date() })
      .where(eq(trainings.id, trainingId));

    const liveSession = await tx.query.liveSessions.findFirst({
      where: and(eq(liveSessions.trainingId, trainingId), eq(liveSessions.status, "active")),
    });

    if (liveSession) {
      if (prevModuleId && prevModuleId !== moduleId) {
        const oldStats = await tx.query.liveSessionModuleStats.findFirst({
          where: and(
            eq(liveSessionModuleStats.liveSessionId, liveSession.id),
            eq(liveSessionModuleStats.moduleId, prevModuleId),
          ),
        });
        if (oldStats && oldStats.isRunning) {
          const elapsedSeconds = Math.floor((Date.now() - oldStats.lastStartedAt.getTime()) / 1000);
          await tx.update(liveSessionModuleStats)
            .set({ isRunning: false, accumulatedSeconds: oldStats.accumulatedSeconds + elapsedSeconds, updatedAt: new Date() })
            .where(eq(liveSessionModuleStats.id, oldStats.id));
        }
      }

      const newStats = await tx.query.liveSessionModuleStats.findFirst({
        where: and(
          eq(liveSessionModuleStats.liveSessionId, liveSession.id),
          eq(liveSessionModuleStats.moduleId, moduleId),
        ),
      });
      if (newStats) {
        const updated = await tx.update(liveSessionModuleStats)
          .set({ isRunning: true, lastStartedAt: new Date(), updatedAt: new Date() })
          .where(eq(liveSessionModuleStats.id, newStats.id))
          .returning();
        stopwatchData = updated[0];
      } else {
        const inserted = await tx.insert(liveSessionModuleStats).values({
          liveSessionId: liveSession.id,
          moduleId,
          isRunning: true,
          lastStartedAt: new Date(),
        }).returning();
        stopwatchData = inserted[0];
      }
    }

    moduleData = { ...mod, isUnlocked: true };
  });

  // moduleData is always assigned when the tx commits without throwing.
  return { moduleData: moduleData!, stopwatchData };
}

/**
 * Sets (or clears, when 0) a module's countdown limit inside its config JSON.
 * Returns the updated module row so it can be re-broadcast for a live recompute.
 *
 * @throws SocketError FORBIDDEN when unauthorized or the module doesn't belong here.
 */
export async function setModuleTimeLimit(params: {
  trainingId: string;
  moduleId: string;
  userId: string;
  sessionGrants: GrantablePermission[];
  timeLimitSeconds: number;
}): Promise<Module> {
  const { trainingId, moduleId, userId, sessionGrants, timeLimitSeconds } = params;
  let moduleData: Module | undefined;

  await db.transaction(async (tx) => {
    const facilitator = await tx.query.trainingFacilitators.findFirst({
      where: and(
        eq(trainingFacilitators.trainingId, trainingId),
        eq(trainingFacilitators.userId, userId),
      ),
    });
    assertCanUnlock(facilitator, sessionGrants, "not authorized to set time limit");

    const mod = await tx.query.trainingModules.findFirst({
      where: and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)),
    });
    if (!mod) throw new SocketError("FORBIDDEN", "not authorized to set time limit");

    const prevConfig = (mod.config ?? {}) as Record<string, unknown>;
    const nextConfig = { ...prevConfig };
    // 0 clears the limit so the stopwatch reverts to count-up mode.
    if (timeLimitSeconds === 0) delete nextConfig.timeLimitSeconds;
    else nextConfig.timeLimitSeconds = timeLimitSeconds;

    const updated = await tx
      .update(trainingModules)
      .set({ config: nextConfig, updatedAt: new Date() })
      .where(eq(trainingModules.id, moduleId))
      .returning();
    moduleData = updated[0];
  });

  return moduleData!;
}
