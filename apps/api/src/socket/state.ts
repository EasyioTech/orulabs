import type { TrainingRole, GrantablePermission } from "@oruclass/types";
import { redis } from "../db/redis";

export interface LiveParticipant {
  userId: string;
  name: string;
  role: "trainer" | "participant";
  trainingRole?: TrainingRole;
  socketId: string;
  joinedAt: Date;
}

export interface TrainingLiveState {
  activeModuleId: string | null;
  participants: Map<string, LiveParticipant>;
  isPaused: boolean;
  sessionGrants: Map<string, Set<GrantablePermission>>;
}

// In-memory map for fast access within the process
const liveState = new Map<string, TrainingLiveState>();

const REDIS_KEY = (trainingId: string) => `live:state:${trainingId}`;
const REDIS_TTL = 60 * 60 * 24; // 24h — covers a full training day

export function getOrCreateState(trainingId: string): TrainingLiveState {
  if (!liveState.has(trainingId)) {
    liveState.set(trainingId, {
      activeModuleId: null,
      participants: new Map(),
      isPaused: false,
      sessionGrants: new Map(),
    });
  }
  return liveState.get(trainingId)!;
}

/** Persist activeModuleId and isPaused to Redis so restarts survive. */
export async function persistState(trainingId: string): Promise<void> {
  const state = liveState.get(trainingId);
  if (!state) return;
  try {
    await redis.set(
      REDIS_KEY(trainingId),
      JSON.stringify({ activeModuleId: state.activeModuleId, isPaused: state.isPaused }),
      { EX: REDIS_TTL },
    );
  } catch {
    // Redis failure is non-fatal — in-memory state still serves current process
  }
}

/** Restore state from Redis on first access after a restart. */
export async function restoreState(trainingId: string): Promise<void> {
  if (liveState.has(trainingId)) return;
  try {
    const raw = await redis.get(REDIS_KEY(trainingId));
    if (!raw) return;
    const saved = JSON.parse(raw) as { activeModuleId: string | null; isPaused: boolean };
    liveState.set(trainingId, {
      activeModuleId: saved.activeModuleId,
      participants: new Map(),
      isPaused: saved.isPaused,
      sessionGrants: new Map(),
    });
  } catch {
    // If Redis is unavailable fall back to fresh state
  }
}

export function removeParticipant(trainingId: string, userId: string): void {
  liveState.get(trainingId)?.participants.delete(userId);
}

/**
 * Full ephemeral-state teardown for the end of a live session. Wipes every
 * training-keyed live artifact (in-memory + Redis state, grants, recent-chat
 * buffer) so the next delivery of the same training starts from a clean slate
 * rather than replaying the previous session's module/pause/grants/chat. Durable,
 * liveSessionId-scoped data (responses, module stats, liveSessions rows) is left
 * untouched — analytics and the digest still need it.
 */
export async function endLiveRoom(trainingId: string): Promise<void> {
  const { clearChat } = await import("./lib/chat-buffer");
  liveState.delete(trainingId);
  await Promise.allSettled([
    redis.del(REDIS_KEY(trainingId)),
    redis.del(GRANTS_KEY(trainingId)),
    clearChat(trainingId),
  ]);
}

const GRANTS_KEY = (trainingId: string) => `live:grants:${trainingId}`;

export function grantPermission(trainingId: string, userId: string, permission: GrantablePermission): void {
  const state = getOrCreateState(trainingId);
  if (!state.sessionGrants.has(userId)) state.sessionGrants.set(userId, new Set());
  state.sessionGrants.get(userId)!.add(permission);
  persistGrants(trainingId);
}

export function revokePermission(trainingId: string, userId: string, permission: GrantablePermission): void {
  const state = getOrCreateState(trainingId);
  state.sessionGrants.get(userId)?.delete(permission);
  persistGrants(trainingId);
}

export function getGrants(trainingId: string, userId: string): GrantablePermission[] {
  return Array.from(getOrCreateState(trainingId).sessionGrants.get(userId) ?? []);
}

export function getAllGrants(trainingId: string): Record<string, GrantablePermission[]> {
  const state = getOrCreateState(trainingId);
  const result: Record<string, GrantablePermission[]> = {};
  for (const [userId, perms] of state.sessionGrants) {
    if (perms.size > 0) result[userId] = Array.from(perms);
  }
  return result;
}

function persistGrants(trainingId: string): void {
  const grants = getAllGrants(trainingId);
  redis.set(GRANTS_KEY(trainingId), JSON.stringify(grants), { EX: REDIS_TTL }).catch(() => {});
}

export async function restoreGrants(trainingId: string): Promise<void> {
  try {
    const raw = await redis.get(GRANTS_KEY(trainingId));
    if (!raw) return;
    const saved = JSON.parse(raw) as Record<string, GrantablePermission[]>;
    const state = getOrCreateState(trainingId);
    for (const [userId, perms] of Object.entries(saved)) {
      state.sessionGrants.set(userId, new Set(perms));
    }
  } catch {}
}
