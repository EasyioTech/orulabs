import type { TrainingRole } from "@oruclass/types";
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
    });
  } catch {
    // If Redis is unavailable fall back to fresh state
  }
}

export function removeParticipant(trainingId: string, userId: string): void {
  liveState.get(trainingId)?.participants.delete(userId);
}

export function cleanupTraining(trainingId: string): void {
  liveState.delete(trainingId);
  redis.del(REDIS_KEY(trainingId)).catch(() => {});
}
