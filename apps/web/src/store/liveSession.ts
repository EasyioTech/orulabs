import { create } from "zustand";
import type { TrainingModule, GrantablePermission } from "@oruclass/types";

interface LiveParticipantEntry {
  userId: string;
  name: string;
  role: "trainer" | "participant";
  joinedAt: string;
  connectionStatus: "online" | "offline";
}

type SocketStatus = "connected" | "disconnected" | "reconnecting";

/** Authoritative room snapshot fetched over REST on (re)connect. Mirrors the API's
 *  RoomStateSnapshot — replaces drifted client state after a network drop. */
export interface RoomStateSnapshot {
  trainingId: string;
  sessionStatus: string;
  isPaused: boolean;
  activeModuleId: string | null;
  activeModule: TrainingModule | null;
  participants: Array<{ userId: string; name: string; role: "trainer" | "participant"; joinedAt: string; connectionStatus: "online" | "offline" }>;
  stopwatch: { moduleId: string; accumulatedSeconds: number; isRunning: boolean; lastStartedAt: string } | null;
  responseCounts: Record<string, number>;
  grants: { myGrants: GrantablePermission[]; allGrants: Record<string, GrantablePermission[]> };
  recentChat: Array<{ id: string; userId: string; senderName: string; text: string; sentAt: string }>;
  serverTime: string;
}

interface LiveSessionState {
  trainingId: string | null;
  activeModule: TrainingModule | null;
  participants: Map<string, LiveParticipantEntry>;
  isPaused: boolean;
  responseCounts: Map<string, number>;
  // Recent chat from the last REST snapshot. Populated on reconnect hydration so the
  // chat UI can replay missed messages even when the socket `chat:history` event
  // (which only fires on participant:join) doesn't reach it. Merge-by-id on the
  // consumer side keeps this idempotent with the live `chat:message` stream.
  snapshotChat: RoomStateSnapshot["recentChat"];
  socketStatus: SocketStatus;
  stopwatch: { moduleId: string; accumulatedSeconds: number; isRunning: boolean; lastStartedAt: string } | null;
  sessionStats: { submitted: number; totalParticipants: number; completionPct: number; liveSessionId: string | null } | null;
  setTrainingId: (id: string) => void;
  setActiveModule: (module: TrainingModule | null) => void;
  addParticipant: (p: LiveParticipantEntry) => void;
  batchAddParticipants: (all: LiveParticipantEntry[]) => void;
  removeParticipant: (userId: string) => void;
  hydrateFromSnapshot: (snapshot: RoomStateSnapshot) => void;
  setPaused: (paused: boolean) => void;
  setResponseCount: (moduleId: string, count: number) => void;
  setSocketStatus: (status: SocketStatus) => void;
  setStopwatch: (data: { moduleId: string; accumulatedSeconds: number; isRunning: boolean; lastStartedAt: string } | null) => void;
  setSessionStats: (stats: { submitted: number; totalParticipants: number; completionPct: number; liveSessionId: string } | null) => void;
  // Permissions granted to the current user mid-session by a lead trainer
  grantedPermissions: GrantablePermission[];
  setGrantedPermissions: (perms: GrantablePermission[]) => void;
  addGrantedPermission: (perm: GrantablePermission) => void;
  revokeGrantedPermission: (perm: GrantablePermission) => void;
  // Permissions the current user has granted to others (grantor view)
  sessionGrants: Map<string, GrantablePermission[]>;
  setSessionGrants: (grants: Record<string, GrantablePermission[]>) => void;
  updateSessionGrant: (targetUserId: string, perm: GrantablePermission, granted: boolean) => void;
  reset: () => void;
}

export const useLiveSessionStore = create<LiveSessionState>((set) => ({
  trainingId: null,
  activeModule: null,
  participants: new Map(),
  isPaused: false,
  responseCounts: new Map(),
  snapshotChat: [],
  socketStatus: "connected",
  stopwatch: null,
  sessionStats: null,
  grantedPermissions: [],
  sessionGrants: new Map(),
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
  batchAddParticipants: (all) =>
    set((s) => {
      const next = new Map(s.participants);
      for (const p of all) next.set(p.userId, p);
      return { participants: next };
    }),
  removeParticipant: (userId) =>
    set((s) => {
      const next = new Map(s.participants);
      next.delete(userId);
      return { participants: next };
    }),
  // Overwrite (not merge) local state from the authoritative REST snapshot. A full
  // replace is deliberate: it reconciles participants who LEFT while we were
  // disconnected (a merge-only path like batchAddParticipants would leave ghosts).
  hydrateFromSnapshot: (snapshot) =>
    set({
      activeModule: snapshot.activeModule,
      isPaused: snapshot.isPaused,
      participants: new Map(snapshot.participants.map((p) => [p.userId, {
        userId: p.userId,
        name: p.name,
        role: p.role,
        joinedAt: p.joinedAt,
        connectionStatus: p.connectionStatus,
      }])),
      responseCounts: new Map(Object.entries(snapshot.responseCounts)),
      stopwatch: snapshot.stopwatch,
      snapshotChat: snapshot.recentChat,
      grantedPermissions: snapshot.grants.myGrants,
      sessionGrants: new Map(Object.entries(snapshot.grants.allGrants)),
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
  setGrantedPermissions: (grantedPermissions) => set({ grantedPermissions }),
  addGrantedPermission: (perm) => set((s) => ({
    grantedPermissions: s.grantedPermissions.includes(perm) ? s.grantedPermissions : [...s.grantedPermissions, perm],
  })),
  revokeGrantedPermission: (perm) => set((s) => ({
    grantedPermissions: s.grantedPermissions.filter((p) => p !== perm),
  })),
  setSessionGrants: (grants) => set({
    sessionGrants: new Map(Object.entries(grants)),
  }),
  updateSessionGrant: (targetUserId, perm, granted) => set((s) => {
    const next = new Map(s.sessionGrants);
    const current = next.get(targetUserId) ?? [];
    next.set(targetUserId, granted ? (current.includes(perm) ? current : [...current, perm]) : current.filter((p) => p !== perm));
    return { sessionGrants: next };
  }),
  reset: () =>
    set({
      trainingId: null,
      activeModule: null,
      participants: new Map(),
      isPaused: false,
      responseCounts: new Map(),
      snapshotChat: [],
      socketStatus: "connected",
      stopwatch: null,
      sessionStats: null,
      grantedPermissions: [],
      sessionGrants: new Map(),
    }),
}));
