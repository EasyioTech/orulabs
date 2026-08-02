import type { TrainingRole } from "@oruclass/types";
import { hasPermission } from "@oruclass/utils";
import { ParticipantJoinSchema } from "@oruclass/validators";
import { logger } from "../../utils/logger";
import { HEARTBEAT_WRITE_MS } from "../../config/limits";
import { getUserName } from "../caches/user-cache";
import { getActiveLiveSessionId } from "../caches/live-session-cache";
import {
  getOrCreateState,
  removeParticipant,
  restoreState,
  restoreGrants,
  getGrants,
  getAllGrants,
} from "../state";
import { getModuleById } from "../services/modules.service";
import { getModuleStats } from "../services/stopwatch.service";
import {
  getRosterSnapshot,
  getFacilitator,
  markParticipantOnline,
  markParticipantOffline,
  writeHeartbeat,
  getTraining,
} from "../services/roster.service";
import type { ConnContext } from "../lib/context";

export function registerParticipantHandlers(ctx: ConnContext): void {
  const { io, socket, userId, on } = ctx;

  // Heartbeats arrive every few seconds per participant; writing the DB on each one is
  // needless write amplification (100 participants × every beat). lastHeartbeat only
  // drives stale/offline detection, so persisting at most every HEARTBEAT_WRITE_MS is
  // plenty — well under the 20s pingTimeout used for disconnect detection.
  let lastHeartbeatWrite = 0;

  on("participant:join", ParticipantJoinSchema, async (data) => {
    const { trainingId, role } = data;
    socket.data.trainingId = trainingId;

    await socket.join(`training:${trainingId}`);

    // Restore persisted state from Redis if this is the first connection after restart.
    await restoreState(trainingId);
    await restoreGrants(trainingId);

    // Never trust the client-supplied role. A "trainer" claim is only honored if the
    // user is a real facilitator in DB; otherwise it is silently downgraded to
    // "participant". effectiveRole is what we store and broadcast.
    let effectiveRole: "trainer" | "participant" = "participant";
    let trainingRole: TrainingRole | null = null;
    if (role === "trainer") {
      const facilitator = await getFacilitator(trainingId, userId);
      if (facilitator) {
        effectiveRole = "trainer";
        trainingRole = facilitator.role as TrainingRole;
      } else {
        socket.emit("error", { code: "UNAUTHORIZED", message: "not a facilitator for this training" });
      }
    }
    socket.data.role = effectiveRole;
    socket.data.trainingRole = trainingRole;

    // Trainers also join a sub-room. Dashboard-only telemetry (submission progress) is
    // emitted there instead of the whole training room, so a 40-participant quiz storm
    // doesn't blast every participant socket with updates only the trainer UI consumes.
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

    await markParticipantOnline(trainingId, userId);

    socket.to(`training:${trainingId}`).emit("participant:joined", {
      userId,
      name,
      role: effectiveRole,
      trainingRole,
      joinedAt: new Date().toISOString(),
      connectionStatus: "online",
    });

    // Sync the existing roster to the joining socket from the DB (durable across
    // restarts, real connectionStatus per participant).
    socket.emit("roster:snapshot", { participants: await getRosterSnapshot(trainingId, userId) });

    // Restore active module only if session is currently live.
    const trainingData = await getTraining(trainingId);

    if (!trainingData || trainingData.sessionStatus === "draft" || trainingData.sessionStatus === "completed") {
      socket.emit("error", { code: "SESSION_NOT_OPEN", message: "session is not open yet" });
      return;
    }

    if (trainingData.sessionStatus === "live") {
      if (!state.activeModuleId && trainingData.currentActiveModuleId) {
        state.activeModuleId = trainingData.currentActiveModuleId;
      }

      if (state.activeModuleId) {
        const moduleData = await getModuleById(state.activeModuleId);
        socket.emit("module:unlocked", { moduleId: state.activeModuleId, module: moduleData ?? null });

        const liveSessionId = await getActiveLiveSessionId(trainingId);
        if (liveSessionId) {
          const stats = await getModuleStats(liveSessionId, state.activeModuleId);
          if (stats) {
            socket.emit("stopwatch:sync", {
              moduleId: state.activeModuleId,
              accumulatedSeconds: stats.accumulatedSeconds,
              isRunning: stats.isRunning,
              lastStartedAt: stats.lastStartedAt.toISOString(),
            });
          }
        }
      }
    }

    // Send grants snapshot: own granted permissions + full map for assign_roles users.
    const myGrants = getGrants(trainingId, userId);
    const canAssign = trainingRole && hasPermission(trainingRole, "assign_roles");
    socket.emit("session:grants_snapshot", {
      myGrants,
      allGrants: canAssign ? getAllGrants(trainingId) : {},
    });
  });

  // No payload; throttled DB write. Not rate-limited or schema-validated (kept as a
  // raw listener to preserve prior behavior).
  socket.on("heartbeat", async () => {
    const { trainingId } = socket.data;
    if (!trainingId || !userId) return;
    const now = Date.now();
    if (now - lastHeartbeatWrite < HEARTBEAT_WRITE_MS) return;
    lastHeartbeatWrite = now;
    await writeHeartbeat(trainingId, userId);
  });

  socket.on("disconnect", async () => {
    const { trainingId } = socket.data;
    if (!trainingId || !userId) return;

    // A reconnect (network blip) or a second tab/device creates a fresh socket while
    // this old one's disconnect fires up to pingTimeout (20s) later. If the user still
    // has another live socket in this room, this disconnect is stale — marking offline
    // or broadcasting a leave here would ghost a participant who is actually present.
    // The disconnecting socket has already left its rooms, so fetchSockets() returns
    // only the survivors.
    const remaining = await io.in(`training:${trainingId}`).fetchSockets();
    if (remaining.some((s) => s.data.userId === userId)) {
      logger.debug({ socketId: socket.id, userId, trainingId }, "socket gone but user still present — skipping offline");
      return;
    }

    removeParticipant(trainingId, userId);
    await markParticipantOffline(trainingId, userId);

    socket.to(`training:${trainingId}`).emit("participant:left", { userId });
    logger.debug({ socketId: socket.id, userId, trainingId }, "socket disconnected");
  });

  // ── ATTENTION TRACKING ────────────────────────────────────────────────────
  socket.on("participant:focus_lost", async () => {
    const tid = socket.data.trainingId;
    if (!tid) return;
    const userName = await getUserName(userId);
    io.to(`training:${tid}:trainers`).emit("trainer:attention_alert", { userId, userName, isFocused: false });
  });

  socket.on("participant:focus_restored", async () => {
    const tid = socket.data.trainingId;
    if (!tid) return;
    const userName = await getUserName(userId);
    io.to(`training:${tid}:trainers`).emit("trainer:attention_alert", { userId, userName, isFocused: true });
  });
}
