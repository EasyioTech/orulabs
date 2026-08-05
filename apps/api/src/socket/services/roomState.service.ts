import type { GrantablePermission, TrainingModule, TrainingRole } from "@oruclass/types";
import { hasPermission } from "@oruclass/utils";
import { and, count, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { participantResponses, trainingParticipants } from "../../db/schema";
import { getActiveLiveSessionId } from "../caches/live-session-cache";
import { getRecentChat, type BufferedChatMessage } from "../lib/chat-buffer";
import { getModuleById } from "./modules.service";
import { getModuleStats } from "./stopwatch.service";
import { getRosterSnapshot, getFacilitator, getTraining, type RosterEntry } from "./roster.service";
import {
  getOrCreateState,
  restoreState,
  restoreGrants,
  getGrants,
  getAllGrants,
} from "../state";

export interface RoomStateSnapshot {
  trainingId: string;
  sessionStatus: string;
  isPaused: boolean;
  activeModuleId: string | null;
  activeModule: TrainingModule | null;
  participants: RosterEntry[];
  stopwatch: { moduleId: string; accumulatedSeconds: number; isRunning: boolean; lastStartedAt: string } | null;
  responseCounts: Record<string, number>;
  grants: { myGrants: GrantablePermission[]; allGrants: Record<string, GrantablePermission[]> };
  recentChat: BufferedChatMessage[];
  serverTime: string;
}

/**
 * Consolidated, authoritative room snapshot for reconnect recovery. A client that dropped
 * off the socket stream can't trust its in-memory state anymore (missed module changes,
 * roster churn, pause/resume, submission counts), so instead of stitching state back
 * together from a cascade of individual socket emits it fetches this once over REST and
 * overwrites its store. Returns null if the user is neither a participant nor a
 * facilitator of the training (caller maps that to 403/404).
 */
export async function buildRoomStateSnapshot(
  trainingId: string,
  userId: string,
): Promise<RoomStateSnapshot | null> {
  const training = await getTraining(trainingId);
  if (!training) return null;

  // Membership: a facilitator (trainer) or an enrolled participant may read the snapshot.
  const [facilitator, participation] = await Promise.all([
    getFacilitator(trainingId, userId),
    db.query.trainingParticipants.findFirst({
      where: and(
        eq(trainingParticipants.trainingId, trainingId),
        eq(trainingParticipants.userId, userId),
      ),
      columns: { userId: true },
    }),
  ]);
  if (!facilitator && !participation) return null;

  // Redis-restore in-memory state so a snapshot served right after an API restart still
  // reflects the real active module / pause / grants rather than a blank slate.
  await restoreState(trainingId);
  await restoreGrants(trainingId);
  const state = getOrCreateState(trainingId);

  const activeModuleId =
    state.activeModuleId ??
    (training.sessionStatus === "live" ? training.currentActiveModuleId ?? null : null);

  const liveSessionId = await getActiveLiveSessionId(trainingId);

  const [participants, activeModule, stopwatchStats, respRow, recentChat] = await Promise.all([
    getRosterSnapshot(trainingId, userId),
    activeModuleId ? getModuleById(activeModuleId) : Promise.resolve(null),
    activeModuleId && liveSessionId ? getModuleStats(liveSessionId, activeModuleId) : Promise.resolve(undefined),
    activeModuleId && liveSessionId
      ? db
          .select({ responseCount: count() })
          .from(participantResponses)
          .where(and(
            eq(participantResponses.trainingId, trainingId),
            eq(participantResponses.moduleId, activeModuleId),
            eq(participantResponses.liveSessionId, liveSessionId),
          ))
      : Promise.resolve([{ responseCount: 0 }] as const),
    getRecentChat(trainingId),
  ]);

  const responseCounts: Record<string, number> = {};
  if (activeModuleId) responseCounts[activeModuleId] = Number(respRow[0].responseCount);

  const trainingRole = (facilitator?.role as TrainingRole | undefined) ?? null;
  const canAssign = trainingRole ? hasPermission(trainingRole, "assign_roles") : false;

  return {
    trainingId,
    sessionStatus: training.sessionStatus,
    isPaused: state.isPaused,
    activeModuleId,
    activeModule: (activeModule as TrainingModule | null) ?? null,
    participants,
    stopwatch: stopwatchStats
      ? {
          moduleId: activeModuleId as string,
          accumulatedSeconds: stopwatchStats.accumulatedSeconds,
          isRunning: stopwatchStats.isRunning,
          lastStartedAt: stopwatchStats.lastStartedAt.toISOString(),
        }
      : null,
    responseCounts,
    grants: {
      myGrants: getGrants(trainingId, userId),
      allGrants: canAssign ? getAllGrants(trainingId) : {},
    },
    recentChat,
    serverTime: new Date().toISOString(),
  };
}
