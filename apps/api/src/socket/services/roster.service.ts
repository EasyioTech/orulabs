import type { TrainingRole, ConnectionStatus } from "@oruclass/types";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/client";
import {
  trainingParticipants,
  trainingFacilitators,
  trainings,
  users,
} from "../../db/schema";

export interface RosterEntry {
  userId: string;
  name: string;
  role: "trainer" | "participant";
  trainingRole: TrainingRole | null;
  joinedAt: string;
  connectionStatus: ConnectionStatus;
}

/**
 * Durable roster from the DB (trainingParticipants + trainingFacilitators), excluding
 * `selfUserId`. Source of truth survives API restarts and carries each participant's
 * real connectionStatus instead of a hardcoded "online" — a trainer rejoining after a
 * restart sees the real room, not an empty one.
 */
export async function getRosterSnapshot(trainingId: string, selfUserId: string): Promise<RosterEntry[]> {
  const [rows, facilitators] = await Promise.all([
    db
      .select({
        userId: trainingParticipants.userId,
        name: users.name,
        connectionStatus: trainingParticipants.connectionStatus,
        joinedAt: trainingParticipants.joinedAt,
      })
      .from(trainingParticipants)
      .innerJoin(users, eq(users.id, trainingParticipants.userId))
      .where(eq(trainingParticipants.trainingId, trainingId)),
    db
      .select({ userId: trainingFacilitators.userId, role: trainingFacilitators.role })
      .from(trainingFacilitators)
      .where(eq(trainingFacilitators.trainingId, trainingId)),
  ]);

  const facilitatorRoles = new Map(facilitators.map((f) => [f.userId, f.role as TrainingRole]));

  return rows
    .filter((p) => p.userId !== selfUserId)
    .map((p) => {
      const trainingRole = facilitatorRoles.get(p.userId) ?? null;
      return {
        userId: p.userId,
        name: p.name ?? "Unknown User",
        role: (trainingRole ? "trainer" : "participant") as "trainer" | "participant",
        trainingRole,
        joinedAt: (p.joinedAt ?? new Date()).toISOString(),
        connectionStatus: p.connectionStatus,
      };
    });
}

/** Facilitator row for a user in a training, or undefined if they are not a facilitator. */
export function getFacilitator(trainingId: string, userId: string) {
  return db.query.trainingFacilitators.findFirst({
    where: and(
      eq(trainingFacilitators.trainingId, trainingId),
      eq(trainingFacilitators.userId, userId),
    ),
  });
}

/** Upsert on (trainingId, userId) — handles both first join and reconnect. */
export async function markParticipantOnline(trainingId: string, userId: string): Promise<void> {
  await db
    .insert(trainingParticipants)
    .values({ trainingId, userId, connectionStatus: "online", lastHeartbeat: new Date() })
    .onConflictDoUpdate({
      target: [trainingParticipants.trainingId, trainingParticipants.userId],
      set: { connectionStatus: "online", lastHeartbeat: new Date() },
    });
}

export async function markParticipantOffline(trainingId: string, userId: string): Promise<void> {
  await db
    .update(trainingParticipants)
    .set({ connectionStatus: "offline" })
    .where(and(
      eq(trainingParticipants.trainingId, trainingId),
      eq(trainingParticipants.userId, userId),
    ));
}

/** Throttled heartbeat write — callers gate the frequency; this only persists. */
export async function writeHeartbeat(trainingId: string, userId: string): Promise<void> {
  await db
    .update(trainingParticipants)
    .set({ lastHeartbeat: new Date(), connectionStatus: "online" })
    .where(and(
      eq(trainingParticipants.trainingId, trainingId),
      eq(trainingParticipants.userId, userId),
    ));
}

/** Live (non-deleted) training row used to decide whether the session is open. */
export function getTraining(trainingId: string) {
  return db.query.trainings.findFirst({
    where: and(eq(trainings.id, trainingId), isNull(trainings.deletedAt)),
  });
}
