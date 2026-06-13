import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { trainings, trainingModules, trainingDays } from "../db/schema";

// Centralized assertions that an asset belongs to a given workspace.
// Routes call these before mutating to prevent a workspace member from
// writing across tenancy boundaries via a guessed UUID.

export async function trainingInWorkspace(trainingId: string, workspaceId: string): Promise<boolean> {
  const row = await db
    .select({ id: trainings.id })
    .from(trainings)
    .where(and(eq(trainings.id, trainingId), eq(trainings.workspaceId, workspaceId), isNull(trainings.deletedAt)))
    .limit(1);
  return row.length > 0;
}

export async function moduleInWorkspace(
  trainingId: string,
  moduleId: string,
  workspaceId: string,
): Promise<boolean> {
  const row = await db
    .select({ id: trainingModules.id })
    .from(trainingModules)
    .innerJoin(trainings, eq(trainings.id, trainingModules.trainingId))
    .where(
      and(
        eq(trainingModules.id, moduleId),
        eq(trainingModules.trainingId, trainingId),
        eq(trainings.workspaceId, workspaceId),
        isNull(trainings.deletedAt),
      ),
    )
    .limit(1);
  return row.length > 0;
}

export async function dayInWorkspace(
  trainingId: string,
  dayId: string,
  workspaceId: string,
): Promise<boolean> {
  const row = await db
    .select({ id: trainingDays.id })
    .from(trainingDays)
    .innerJoin(trainings, eq(trainings.id, trainingDays.trainingId))
    .where(
      and(
        eq(trainingDays.id, dayId),
        eq(trainingDays.trainingId, trainingId),
        eq(trainings.workspaceId, workspaceId),
        isNull(trainings.deletedAt),
      ),
    )
    .limit(1);
  return row.length > 0;
}
