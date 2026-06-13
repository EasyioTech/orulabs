import { create } from "zustand";
import type { TrainingModule } from "@oruclass/types";

interface LiveParticipantEntry {
  userId: string;
  name: string;
  role: "trainer" | "participant";
  joinedAt: string;
  connectionStatus: "online" | "offline";
}

type SocketStatus = "connected" | "disconnected" | "reconnecting";

interface LiveSessionState {
  trainingId: string | null;
  activeModule: TrainingModule | null;
  participants: Map<string, LiveParticipantEntry>;
  isPaused: boolean;
  responseCounts: Map<string, number>;
  socketStatus: SocketStatus;
  stopwatch: { moduleId: string; accumulatedSeconds: number; isRunning: boolean; lastStartedAt: string } | null;
  sessionStats: { submitted: number; totalParticipants: number; completionPct: number; liveSessionId: string | null } | null;
  setTrainingId: (id: string) => void;
  setActiveModule: (module: TrainingModule | null) => void;
  addParticipant: (p: LiveParticipantEntry) => void;
  removeParticipant: (userId: string) => void;
  setPaused: (paused: boolean) => void;
  setResponseCount: (moduleId: string, count: number) => void;
  setSocketStatus: (status: SocketStatus) => void;
  setStopwatch: (data: { moduleId: string; accumulatedSeconds: number; isRunning: boolean; lastStartedAt: string } | null) => void;
  setSessionStats: (stats: { submitted: number; totalParticipants: number; completionPct: number; liveSessionId: string } | null) => void;
  reset: () => void;
}

export const useLiveSessionStore = create<LiveSessionState>((set) => ({
  trainingId: null,
  activeModule: null,
  participants: new Map(),
  isPaused: false,
  responseCounts: new Map(),
  socketStatus: "connected",
  stopwatch: null,
  sessionStats: null,
  setTrainingId: (trainingId) => set({ trainingId }),
  setActiveModule: (activeModule) => set({ activeModule }),
  addParticipant: (p) =>
    set((s) => {
      const existing = s.participants.get(p.userId);
      if (
        existing &&
        existing.role === p.role &&
        existing.connectionStatus === p.connectionStatus &&
        existing.name === p.name
      ) {
        return s;
      }
      const next = new Map(s.participants);
      next.set(p.userId, p);
      return { participants: next };
    }),
  removeParticipant: (userId) =>
    set((s) => {
      const next = new Map(s.participants);
      next.delete(userId);
      return { participants: next };
    }),
  setPaused: (isPaused) => set({ isPaused }),
  setResponseCount: (moduleId, count) =>
    set((s) => {
      const next = new Map(s.responseCounts);
      next.set(moduleId, count);
      return { responseCounts: next };
    }),
  setSocketStatus: (socketStatus) => set({ socketStatus }),
  setStopwatch: (stopwatch) => set({ stopwatch }),
  setSessionStats: (sessionStats) => set({ sessionStats }),
  reset: () =>
    set({
      trainingId: null,
      activeModule: null,
      participants: new Map(),
      isPaused: false,
      responseCounts: new Map(),
      socketStatus: "connected",
      stopwatch: null,
      sessionStats: null,
    }),
}));
