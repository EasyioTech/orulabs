"use client";

import { useEffect, useRef } from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useLiveSessionStore, type RoomStateSnapshot } from "@/store/liveSession";
import { apiClient } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import type { TrainingModule } from "@oruclass/types";
import { playJoinSound, playLeaveSound, playSessionStartSound, playSessionPauseSound, playSessionResumeSound, playSessionEndSound } from "@/lib/sounds";

export function useSocketSession(trainingId: string | null) {
  const initialized = useRef(false);
  const setActiveModule = useLiveSessionStore((s) => s.setActiveModule);
  const addParticipant = useLiveSessionStore((s) => s.addParticipant);
  const batchAddParticipants = useLiveSessionStore((s) => s.batchAddParticipants);
  const removeParticipant = useLiveSessionStore((s) => s.removeParticipant);
  const setPaused = useLiveSessionStore((s) => s.setPaused);
  const reset = useLiveSessionStore((s) => s.reset);
  const setResponseCount = useLiveSessionStore((s) => s.setResponseCount);
  const setSocketStatus = useLiveSessionStore((s) => s.setSocketStatus);
  const hydrateFromSnapshot = useLiveSessionStore((s) => s.hydrateFromSnapshot);
  const qc = useQueryClient();

  useEffect(() => {
    if (!trainingId || initialized.current) return;
    initialized.current = true;

    const socket = connectSocket();

    const invalidateAll = () => {
      qc.invalidateQueries({ queryKey: ["training"] });
      qc.invalidateQueries({ queryKey: ["participant-training"] });
    };

    // ── STATE-DRIFT RECOVERY ON RECONNECT ─────────────────────────────────────
    // A dropped socket misses every event while it's gone (module changes, roster
    // churn, pause/resume, submission counts), so its in-memory state silently
    // drifts. On reconnect we don't trust the resumed event stream — we fetch one
    // authoritative REST snapshot and overwrite the store. The FIRST connect is
    // skipped: initial state already arrives via react-query + the join emits.
    let hasConnectedBefore = false;
    let hydrating = false;
    const hydrateRoomState = async () => {
      if (!trainingId || hydrating) return;
      hydrating = true;
      try {
        const { data } = await apiClient.get<RoomStateSnapshot>(
          `/api/participant/trainings/${trainingId}/room-state`,
        );
        hydrateFromSnapshot(data);
        invalidateAll();
        qc.invalidateQueries({ queryKey: ["modules"] });
      } catch {
        // Snapshot is best-effort; the socket join emits are the fallback path.
      } finally {
        hydrating = false;
      }
    };

    // Debounce status downgrades — brief flickers reconnect within several
    // seconds and shouldn't surface as "offline" to users. Also: if the
    // browser still reports online, treat it as a transport hiccup and stay
    // silent — only escalate if reconnect actually keeps failing.
    let downgradeTimer: ReturnType<typeof setTimeout> | null = null;
    const clearDowngrade = () => {
      if (downgradeTimer) {
        clearTimeout(downgradeTimer);
        downgradeTimer = null;
      }
    };
    const scheduleDowngrade = (status: "disconnected" | "reconnecting") => {
      clearDowngrade();
      // Real offline → show fast. Transport blip with browser still online
      // → wait long enough for socket.io to reconnect silently.
      const online = typeof navigator === "undefined" ? true : navigator.onLine;
      const delay = online ? 8000 : 1500;
      downgradeTimer = setTimeout(() => setSocketStatus(status), delay);
    };

    socket.on("connect", () => {
      clearDowngrade();
      setSocketStatus("connected");
      if (hasConnectedBefore) void hydrateRoomState();
      hasConnectedBefore = true;
    });
    socket.on("disconnect", () => scheduleDowngrade("disconnected"));
    socket.io?.on?.("reconnect_attempt", () => scheduleDowngrade("reconnecting"));
    // io.on events for engine-level reconnects (some socket.io versions
    // don't bubble these to the socket itself).
    socket.io?.on?.("reconnect", () => {
      clearDowngrade();
      setSocketStatus("connected");
      void hydrateRoomState();
    });
    // Browser-level online event — clear any pending downgrade immediately
    // so we don't show a stale "offline" banner after net comes back.
    const handleOnline = () => clearDowngrade();
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
    }


    socket.on("module:unlocked", ({ moduleId, module }) => {
      setActiveModule(module || (moduleId ? ({ id: moduleId } as TrainingModule) : null));
      invalidateAll();
      qc.invalidateQueries({ queryKey: ["modules"] });
      // No sound on module change — only session lifecycle events trigger audio
    });

    socket.on("roster:snapshot", ({ participants }) => {
      batchAddParticipants(participants.map((p) => ({
        userId: p.userId,
        name: p.name,
        role: p.role,
        joinedAt: p.joinedAt,
        connectionStatus: p.connectionStatus || "online",
      })));
    });

    socket.on("participant:joined", (p) => {
      const isNew = !useLiveSessionStore.getState().participants.has(p.userId);
      addParticipant({
        userId: p.userId,
        name: p.name,
        role: p.role as "trainer" | "participant",
        joinedAt: p.joinedAt,
        connectionStatus: p.connectionStatus || "online",
      });
      if (isNew && p.connectionStatus !== "offline") {
        playJoinSound();
      }
    });

    socket.on("participant:left", ({ userId }) => {
      if (useLiveSessionStore.getState().participants.has(userId)) {
        playLeaveSound();
      }
      removeParticipant(userId);
    });

    // Live response count — store updates immediately (cheap),
    // query invalidation is coalesced per-moduleId so a burst of submissions
    // doesn't trigger a refetch storm on the trainer client.
    const aggregateTimers = new Map<string, ReturnType<typeof setTimeout>>();
    socket.on("data:aggregate", ({ moduleId, responseCount }) => {
      setResponseCount(moduleId, responseCount);
      const existing = aggregateTimers.get(moduleId);
      if (existing) clearTimeout(existing);
      aggregateTimers.set(
        moduleId,
        setTimeout(() => {
          aggregateTimers.delete(moduleId);
          qc.invalidateQueries({ queryKey: ["module-responses", trainingId, moduleId] });
        }, 500),
      );
    });

    socket.on("stopwatch:sync", (data) => {
      useLiveSessionStore.getState().setStopwatch(data);
    });

    socket.on("session:paused", () => {
      setPaused(true);
      invalidateAll();
      playSessionPauseSound();
    });
    socket.on("session:resumed", () => {
      setPaused(false);
      invalidateAll();
      playSessionResumeSound();
    });
    socket.on("session:started", () => {
      setPaused(false);
      invalidateAll();
      playSessionStartSound();
    });
    socket.on("session:ended", () => {
      reset();
      invalidateAll();
      playSessionEndSound();
    });
    socket.on("session:reset", () => {
      reset();
      invalidateAll();
    });

    return () => {
      clearDowngrade();
      for (const t of aggregateTimers.values()) clearTimeout(t);
      aggregateTimers.clear();
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
      }
      socket.io?.off?.("reconnect");
      socket.off("connect");
      socket.off("disconnect");
      socket.io?.off?.("reconnect_attempt");

      socket.off("module:unlocked");
      socket.off("roster:snapshot");
      socket.off("participant:joined");
      socket.off("participant:left");
      socket.off("data:aggregate");
      socket.off("stopwatch:sync");
      socket.off("session:paused");
      socket.off("session:resumed");
      socket.off("session:started");
      socket.off("session:ended");
      socket.off("session:reset");
      disconnectSocket();
      reset();
      initialized.current = false;
    };
  }, [trainingId, setActiveModule, addParticipant, batchAddParticipants, removeParticipant, setPaused, reset, setResponseCount, setSocketStatus, qc]);

  return getSocket();
}

export function useSocket() {
  return getSocket();
}
