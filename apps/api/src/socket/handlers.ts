import type { Server as SocketIOServer, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData, TrainingRole, StrokeData, StickyNote } from "@oruclass/types";
import { hasPermission } from "@oruclass/utils";
import { eq, and, count, desc, isNull } from "drizzle-orm";
import { db } from "../db/client";
import {
  trainingParticipants,
  trainingModules,
  trainings,
  trainingFacilitators,
  participantResponses,
  users,
  liveSessions,
  liveSessionModuleStats,
} from "../db/schema";
import { getOrCreateState, removeParticipant, persistState, restoreState } from "./state";
import { logger } from "../utils/logger";
import { DrawUpdateSchema, DrawClearSchema, DrawSyncSchema, NoteCreateSchema, NotePositionSchema, TimerSyncSchema, ParticipantJoinSchema, ModuleUnlockSchema, ResponseSubmitSchema, StopwatchActionSchema, ModuleSetTimeLimitSchema } from "@oruclass/validators";
import { USER_NAME_CACHE_TTL_MS, USER_NAME_CACHE_MAX } from "../config/limits";

// Small in-process cache for socket-join user lookups. Avoids hammering the
// users table on every reconnect; TTL keeps profile edits visible within a minute.
const userCache = new Map<string, { name: string; expiresAt: number }>();

// Per-training liveSessionId cache. response:submit hits this on every
// answer, and the active liveSession only changes on session start/end/reset.
// 15s TTL bounds staleness; explicit busts on lifecycle events would be
// stricter but aren't required for correctness (worst case: one stale
// submission gets a previous liveSessionId).
const liveSessionCache = new Map<string, { id: string | null; expiresAt: number }>();
const LIVE_SESSION_TTL_MS = 15_000;

// Min interval between persisted heartbeat writes per socket (see heartbeat handler).
const HEARTBEAT_WRITE_MS = 15_000;

async function getActiveLiveSessionId(trainingId: string): Promise<string | null> {
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

async function getUserName(userId: string): Promise<string> {
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

type IO = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// Emit the durable roster (from DB) to a freshly-joined socket. Source of truth is
// trainingParticipants + trainingFacilitators, so it survives API restarts and
// carries each participant's real connectionStatus instead of a hardcoded "online".
async function syncRosterFromDb(socket: AppSocket, trainingId: string, selfUserId: string): Promise<void> {
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

  for (const p of rows) {
    if (p.userId === selfUserId) continue;
    const trainingRole = facilitatorRoles.get(p.userId) ?? null;
    socket.emit("participant:joined", {
      userId: p.userId,
      name: p.name ?? "Unknown User",
      role: trainingRole ? "trainer" : "participant",
      trainingRole,
      joinedAt: (p.joinedAt ?? new Date()).toISOString(),
      connectionStatus: p.connectionStatus,
    });
  }
}

// Per-event rate limits: [maxRequests, windowMs]
const EVENT_LIMITS: Record<string, [number, number]> = {
  "participant:join": [5, 10_000],
  "module:unlock": [20, 1_000],
  "response:submit": [10, 1_000],
  "draw:update": [60, 1_000],
  "note:create": [10, 1_000],
  "note:position": [60, 1_000],
  "timer:sync": [10, 1_000],
};

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

function scheduleAggregate(io: IO, trainingId: string, moduleId: string): void {
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

function makePerEventRateLimiter() {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return (event: string): boolean => {
    const limit = EVENT_LIMITS[event];
    if (!limit) return true;
    const [max, windowMs] = limit;
    const now = Date.now();
    const bucket = buckets.get(event);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(event, { count: 1, resetAt: now + windowMs });
      return true;
    }
    bucket.count++;
    return bucket.count <= max;
  };
}

export function registerSocketHandlers(io: IO): void {
  io.on("connection", (socket: AppSocket) => {
    // userId is set by JWT handshake middleware in index.ts — never trust client payload
    const userId = socket.data.userId!;
    logger.debug({ socketId: socket.id, userId }, "socket connected");

    const isAllowed = makePerEventRateLimiter();

    // Heartbeats arrive every few seconds per participant; writing the DB on each
    // one is needless write amplification (100 participants × every beat). lastHeartbeat
    // only drives stale/offline detection, so persisting at most every HEARTBEAT_WRITE_MS
    // is plenty — well under the 20s pingTimeout used for disconnect detection.
    let lastHeartbeatWrite = 0;

    const guard = <A extends unknown[]>(event: string, fn: (...args: A) => void) =>
      (...args: A) => {
        if (!isAllowed(event)) {
          socket.emit("error", { code: "RATE_LIMIT", message: "rate limit exceeded" });
          return;
        }
        fn(...args);
      };

    socket.on(
      "participant:join",
      guard("participant:join", async (payload: unknown) => {
        const parsed = ParticipantJoinSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid participant:join payload" });
          return;
        }
        const { trainingId, role } = parsed.data;
        socket.data.trainingId = trainingId;

        await socket.join(`training:${trainingId}`);

        // Restore persisted state from Redis if this is the first connection after restart
        await restoreState(trainingId);

        // Never trust the client-supplied role. A "trainer" claim is only honored
        // if the user is a real facilitator in DB; otherwise it is silently
        // downgraded to "participant". effectiveRole is what we store and broadcast —
        // the prior code leaked the unverified client role into the roster.
        let effectiveRole: "trainer" | "participant" = "participant";
        let trainingRole: TrainingRole | null = null;
        if (role === "trainer") {
          const facilitator = await db.query.trainingFacilitators.findFirst({
            where: and(
              eq(trainingFacilitators.trainingId, trainingId),
              eq(trainingFacilitators.userId, userId),
            ),
          });
          if (facilitator) {
            effectiveRole = "trainer";
            trainingRole = facilitator.role as TrainingRole;
          } else {
            socket.emit("error", { code: "UNAUTHORIZED", message: "not a facilitator for this training" });
          }
        }
        socket.data.role = effectiveRole;
        socket.data.trainingRole = trainingRole;

        // Trainers also join a sub-room. Dashboard-only telemetry (submission
        // progress) is emitted there instead of the whole training room, so a
        // 40-participant quiz storm doesn't blast every participant socket with
        // updates only the trainer UI consumes.
        if (effectiveRole === "trainer") {
          await socket.join(`training:${trainingId}:trainers`);
        }

        const name = await getUserName(userId);

        const state = getOrCreateState(trainingId);
        state.participants.set(userId, {
          userId,
          name,
          role: effectiveRole,
          socketId: socket.id,
          joinedAt: new Date(),
        });

        // Upsert — handles both first join and reconnect correctly
        await db
          .insert(trainingParticipants)
          .values({ trainingId, userId, connectionStatus: "online", lastHeartbeat: new Date() })
          .onConflictDoUpdate({
            target: [trainingParticipants.trainingId, trainingParticipants.userId],
            set: { connectionStatus: "online", lastHeartbeat: new Date() },
          });

        socket.to(`training:${trainingId}`).emit("participant:joined", {
          userId,
          name,
          role: effectiveRole,
          trainingRole,
          joinedAt: new Date().toISOString(),
          connectionStatus: "online",
        });

        // Sync the existing roster to the joining socket from the DB rather than
        // in-memory state. After an API restart the in-memory roster is empty until
        // everyone reconnects, so a trainer rejoining would see an empty room. The
        // DB roster is durable and carries real connectionStatus per participant.
        await syncRosterFromDb(socket, trainingId, userId);

        // Restore active module only if session is currently live
        const trainingData = await db.query.trainings.findFirst({
          where: and(eq(trainings.id, trainingId), isNull(trainings.deletedAt)),
        });

        if (!trainingData || trainingData.sessionStatus === "draft" || trainingData.sessionStatus === "completed") {
          socket.emit("error", { code: "SESSION_NOT_OPEN", message: "session is not open yet" });
          return;
        }

        if (trainingData.sessionStatus === "live") {
          if (!state.activeModuleId && trainingData.currentActiveModuleId) {
            state.activeModuleId = trainingData.currentActiveModuleId;
          }

          if (state.activeModuleId) {
            const moduleData = await db.query.trainingModules.findFirst({
              where: eq(trainingModules.id, state.activeModuleId),
            });
            socket.emit("module:unlocked", {
              moduleId: state.activeModuleId,
              module: moduleData ?? null,
            });

            const liveSessionId = await getActiveLiveSessionId(trainingId);
            if (liveSessionId) {
              const stats = await db.query.liveSessionModuleStats.findFirst({
                where: and(
                  eq(liveSessionModuleStats.liveSessionId, liveSessionId),
                  eq(liveSessionModuleStats.moduleId, state.activeModuleId)
                )
              });
              if (stats) {
                socket.emit("stopwatch:sync", {
                  moduleId: state.activeModuleId,
                  accumulatedSeconds: stats.accumulatedSeconds,
                  isRunning: stats.isRunning,
                  lastStartedAt: stats.lastStartedAt.toISOString()
                });
              }
            }
          }
        }
      }),
    );

    socket.on(
      "module:unlock",
      guard("module:unlock", async (payload: unknown) => {
        const parsed = ModuleUnlockSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid module:unlock payload" });
          return;
        }
        const { trainingId, moduleId } = parsed.data;
        // Re-query facilitator role inside the tx — cached socket.data.role
        // can be stale if a trainer was demoted mid-session.
        const state = getOrCreateState(trainingId);
        const prevModuleId = state.activeModuleId;

        let moduleData: typeof trainingModules.$inferSelect | undefined;
        let stopwatchData: typeof liveSessionModuleStats.$inferSelect | undefined;
        let denied = false;
        try {
          await db.transaction(async (tx) => {
            const facilitator = await tx.query.trainingFacilitators.findFirst({
              where: and(
                eq(trainingFacilitators.trainingId, trainingId),
                eq(trainingFacilitators.userId, userId),
              ),
            });
            // Only roles with unlock_modules (lead_trainer, full_editor) may drive
            // the live room. partial_editor / facilitation_support are denied even
            // though they're facilitators.
            if (!facilitator || !hasPermission(facilitator.role as TrainingRole, "unlock_modules")) {
              denied = true;
              return;
            }

            // Confirm the module actually belongs to this training before unlocking.
            const mod = await tx.query.trainingModules.findFirst({
              where: and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)),
            });
            if (!mod) {
              denied = true;
              return;
            }

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
                     eq(liveSessionModuleStats.moduleId, prevModuleId)
                   )
                });
                if (oldStats && oldStats.isRunning) {
                  const elapsedSeconds = Math.floor((Date.now() - oldStats.lastStartedAt.getTime()) / 1000);
                  await tx.update(liveSessionModuleStats)
                    .set({
                      isRunning: false,
                      accumulatedSeconds: oldStats.accumulatedSeconds + elapsedSeconds,
                      updatedAt: new Date()
                    })
                    .where(eq(liveSessionModuleStats.id, oldStats.id));
                }
              }

              const newStats = await tx.query.liveSessionModuleStats.findFirst({
                where: and(
                  eq(liveSessionModuleStats.liveSessionId, liveSession.id),
                  eq(liveSessionModuleStats.moduleId, moduleId)
                )
              });
              if (newStats) {
                const updated = await tx.update(liveSessionModuleStats)
                  .set({
                    isRunning: true,
                    lastStartedAt: new Date(),
                    updatedAt: new Date()
                  })
                  .where(eq(liveSessionModuleStats.id, newStats.id))
                  .returning();
                stopwatchData = updated[0];
              } else {
                const inserted = await tx.insert(liveSessionModuleStats).values({
                  liveSessionId: liveSession.id,
                  moduleId: moduleId,
                  isRunning: true,
                  lastStartedAt: new Date(),
                }).returning();
                stopwatchData = inserted[0];
              }
            }

            moduleData = { ...mod, isUnlocked: true };
          });
        } catch (err) {
          logger.error(err, "module:unlock tx failed");
          socket.emit("error", { code: "INTERNAL", message: "failed to unlock module" });
          return;
        }

        if (denied || !moduleData) {
          socket.emit("error", { code: "FORBIDDEN", message: "not authorized to unlock this module" });
          return;
        }

        state.activeModuleId = moduleId;

        io.to(`training:${trainingId}`).emit("module:unlocked", {
          moduleId,
          module: moduleData,
        });

        if (stopwatchData) {
          io.to(`training:${trainingId}`).emit("stopwatch:sync", {
            moduleId,
            accumulatedSeconds: stopwatchData.accumulatedSeconds,
            isRunning: stopwatchData.isRunning,
            lastStartedAt: stopwatchData.lastStartedAt.toISOString()
          });
        }

        // Persist new active module to Redis for restart survivability
        await persistState(trainingId);
      }),
    );

    socket.on(
      "stopwatch:action",
      guard("stopwatch:action", async (payload: unknown) => {
        const parsed = StopwatchActionSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid stopwatch:action payload" });
          return;
        }
        const { trainingId, moduleId, action } = parsed.data;

        let stopwatchData: typeof liveSessionModuleStats.$inferSelect | undefined;
        let denied = false;
        try {
          await db.transaction(async (tx) => {
            const facilitator = await tx.query.trainingFacilitators.findFirst({
              where: and(
                eq(trainingFacilitators.trainingId, trainingId),
                eq(trainingFacilitators.userId, userId),
              ),
            });
            // Stopwatch is a room-control action — requires pause_room (lead_trainer,
            // full_editor). partial_editor / facilitation_support cannot control it.
            if (!facilitator || !hasPermission(facilitator.role as TrainingRole, "pause_room")) {
              denied = true;
              return;
            }

            const liveSession = await tx.query.liveSessions.findFirst({
              where: and(eq(liveSessions.trainingId, trainingId), eq(liveSessions.status, "active")),
            });
            if (!liveSession) return;

            const stats = await tx.query.liveSessionModuleStats.findFirst({
              where: and(
                eq(liveSessionModuleStats.liveSessionId, liveSession.id),
                eq(liveSessionModuleStats.moduleId, moduleId)
              )
            });

            if (!stats) return;

            if (action === "pause" && stats.isRunning) {
              const elapsedSeconds = Math.floor((Date.now() - stats.lastStartedAt.getTime()) / 1000);
              const updated = await tx.update(liveSessionModuleStats)
                .set({
                  isRunning: false,
                  accumulatedSeconds: stats.accumulatedSeconds + elapsedSeconds,
                  updatedAt: new Date()
                })
                .where(eq(liveSessionModuleStats.id, stats.id))
                .returning();
              stopwatchData = updated[0];
            } else if (action === "resume" && !stats.isRunning) {
              const updated = await tx.update(liveSessionModuleStats)
                .set({
                  isRunning: true,
                  lastStartedAt: new Date(),
                  updatedAt: new Date()
                })
                .where(eq(liveSessionModuleStats.id, stats.id))
                .returning();
              stopwatchData = updated[0];
            } else if (action === "reset") {
              const updated = await tx.update(liveSessionModuleStats)
                .set({
                  isRunning: false,
                  accumulatedSeconds: 0,
                  updatedAt: new Date()
                })
                .where(eq(liveSessionModuleStats.id, stats.id))
                .returning();
              stopwatchData = updated[0];
            }
          });
        } catch (err) {
          logger.error(err, "stopwatch:action tx failed");
          socket.emit("error", { code: "INTERNAL", message: "failed to action stopwatch" });
          return;
        }

        if (denied) {
          socket.emit("error", { code: "FORBIDDEN", message: "not authorized to control stopwatch" });
          return;
        }

        if (stopwatchData) {
          io.to(`training:${trainingId}`).emit("stopwatch:sync", {
            moduleId,
            accumulatedSeconds: stopwatchData.accumulatedSeconds,
            isRunning: stopwatchData.isRunning,
            lastStartedAt: stopwatchData.lastStartedAt.toISOString()
          });
        }
      }),
    );

    socket.on(
      "module:setTimeLimit",
      guard("module:setTimeLimit", async (payload: unknown) => {
        const parsed = ModuleSetTimeLimitSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid module:setTimeLimit payload" });
          return;
        }
        const { trainingId, moduleId, timeLimitSeconds } = parsed.data;

        let moduleData: typeof trainingModules.$inferSelect | undefined;
        let denied = false;
        try {
          await db.transaction(async (tx) => {
            const facilitator = await tx.query.trainingFacilitators.findFirst({
              where: and(
                eq(trainingFacilitators.trainingId, trainingId),
                eq(trainingFacilitators.userId, userId),
              ),
            });
            // Editing the live time limit is a room-control action — same gate as unlock.
            if (!facilitator || !hasPermission(facilitator.role as TrainingRole, "unlock_modules")) {
              denied = true;
              return;
            }

            const mod = await tx.query.trainingModules.findFirst({
              where: and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)),
            });
            if (!mod) {
              denied = true;
              return;
            }

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
        } catch (err) {
          logger.error(err, "module:setTimeLimit tx failed");
          socket.emit("error", { code: "INTERNAL", message: "failed to set time limit" });
          return;
        }

        if (denied || !moduleData) {
          socket.emit("error", { code: "FORBIDDEN", message: "not authorized to set time limit" });
          return;
        }

        // Re-broadcast the updated module so every client recomputes the countdown live.
        io.to(`training:${trainingId}`).emit("module:unlocked", {
          moduleId,
          module: moduleData,
        });
      }),
    );

    socket.on(
      "response:submit",
      guard("response:submit", async (
        payload: unknown,
        ack?: (result: { ok: boolean; error?: string }) => void,
      ) => {
        const parsed = ResponseSubmitSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid response:submit payload" });
          if (typeof ack === "function") ack({ ok: false, error: "Invalid payload" });
          return;
        }
        const { trainingId, moduleId, responseData } = parsed.data;
        try {
          const liveSessionId = await getActiveLiveSessionId(trainingId);
          let timeSpentSeconds = null;
          
          if (liveSessionId) {
            const stats = await db.query.liveSessionModuleStats.findFirst({
              where: and(
                eq(liveSessionModuleStats.liveSessionId, liveSessionId),
                eq(liveSessionModuleStats.moduleId, moduleId)
              )
            });
            if (stats) {
              const elapsedSeconds = stats.isRunning ? Math.floor((Date.now() - stats.lastStartedAt.getTime()) / 1000) : 0;
              timeSpentSeconds = stats.accumulatedSeconds + elapsedSeconds;
            }
          }

          // Single upsert — requires UNIQUE (training_id, module_id, user_id).
          // Avoids the read-then-write race that lets two near-simultaneous
          // submissions from the same participant create duplicates.
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

          // Ack immediately — counts/broadcasts can lag the ack without
          // affecting the participant's UX.
          if (typeof ack === "function") ack({ ok: true });

          // Coalesced broadcast: collapses a storm of submits into one count + one
          // fan-out per module per AGGREGATE_FLUSH_MS window (see scheduleAggregate).
          scheduleAggregate(io, trainingId, moduleId);
        } catch (err) {
          logger.error(err, "response:submit failed");
          if (typeof ack === "function") ack({ ok: false, error: "Failed to save response" });
        }
      }),
    );

    socket.on(
      "draw:update",
      guard("draw:update", (payload: unknown) => {
        const parsed = DrawUpdateSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid draw:update payload" });
          return;
        }
        const { trainingId, moduleId, stroke } = parsed.data;
        socket.to(`training:${trainingId}`).emit("draw:update", { moduleId, userId, stroke });
      }),
    );

    socket.on(
      "draw:clear",
      guard("draw:clear", (payload: unknown) => {
        const parsed = DrawClearSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid draw:clear payload" });
          return;
        }
        const { trainingId, moduleId } = parsed.data;
        socket.to(`training:${trainingId}`).emit("draw:clear", { moduleId, userId });
      }),
    );

    socket.on(
      "draw:sync",
      guard("draw:sync", (payload: unknown) => {
        const parsed = DrawSyncSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid draw:sync payload" });
          return;
        }
        const { trainingId, moduleId, strokes } = parsed.data;
        socket.to(`training:${trainingId}`).emit("draw:sync", { moduleId, userId, strokes: strokes as StrokeData[] });
      }),
    );

    socket.on(
      "note:create",
      guard("note:create", (payload: unknown) => {
        const parsed = NoteCreateSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid note:create payload" });
          return;
        }
        const { trainingId, moduleId, note } = parsed.data;
        socket.to(`training:${trainingId}`).emit("note:create", { moduleId, note: note as StickyNote });
      }),
    );

    socket.on(
      "note:position",
      guard("note:position", (payload: unknown) => {
        const parsed = NotePositionSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid note:position payload" });
          return;
        }
        const { trainingId, moduleId, noteId, x, y } = parsed.data;
        socket.to(`training:${trainingId}`).emit("note:position", { moduleId, noteId, x, y });
      }),
    );

    socket.on(
      "timer:sync",
      guard("timer:sync", (payload: unknown) => {
        const parsed = TimerSyncSchema.safeParse(payload);
        if (!parsed.success) {
          socket.emit("error", { code: "BAD_PAYLOAD", message: "invalid timer:sync payload" });
          return;
        }
        const { trainingId, moduleId, remaining, running, duration } = parsed.data;
        socket.to(`training:${trainingId}`).emit("timer:sync", { moduleId, remaining, running, duration });
      }),
    );

    socket.on("heartbeat", async () => {
      const { trainingId } = socket.data;
      if (!trainingId || !userId) return;
      const now = Date.now();
      if (now - lastHeartbeatWrite < HEARTBEAT_WRITE_MS) return;
      lastHeartbeatWrite = now;
      await db
        .update(trainingParticipants)
        .set({ lastHeartbeat: new Date(), connectionStatus: "online" })
        .where(
          and(
            eq(trainingParticipants.trainingId, trainingId),
            eq(trainingParticipants.userId, userId),
          ),
        );
    });

    socket.on("disconnect", async () => {
      const { trainingId } = socket.data;
      if (!trainingId || !userId) return;

      // A reconnect (network blip) or a second tab/device creates a fresh socket
      // while this old one's disconnect fires up to pingTimeout (20s) later. If the
      // user still has another live socket in this room, this disconnect is stale —
      // marking offline or broadcasting a leave here would ghost a participant who is
      // actually present. The disconnecting socket has already left its rooms by now,
      // so fetchSockets() returns only the survivors.
      const remaining = await io.in(`training:${trainingId}`).fetchSockets();
      if (remaining.some((s) => s.data.userId === userId)) {
        logger.debug({ socketId: socket.id, userId, trainingId }, "socket gone but user still present — skipping offline");
        return;
      }

      removeParticipant(trainingId, userId);

      await db
        .update(trainingParticipants)
        .set({ connectionStatus: "offline" })
        .where(
          and(
            eq(trainingParticipants.trainingId, trainingId),
            eq(trainingParticipants.userId, userId),
          ),
        );

      socket.to(`training:${trainingId}`).emit("participant:left", { userId });
      logger.debug({ socketId: socket.id, userId, trainingId }, "socket disconnected");
    });
  });
}
