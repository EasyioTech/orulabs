"use client";

import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useModules, useUnlockModule } from "@/hooks/useModules";
import { useDays } from "@/hooks/useDays";
import { useUpdateTrainingStatus, useResetSession, useTrainings } from "@/hooks/useTrainings";
import { useLiveSessionStore } from "@/store/liveSession";
import { RoleGate } from "@/components/shared/RoleGate";
import type { Training, TrainingRole } from "@oruclass/types";
import { cn } from "@oruclass/utils";
import { Play, Pause, Square, RotateCcw, Lock, Unlock, PlayCircle, RefreshCw, Users, AlertCircle } from "lucide-react";

interface Props {
  trainingId: string;
  workspaceId: string;
  training: Training;
  userTrainingRole?: TrainingRole;
}

export function ControlPanel({ trainingId, workspaceId, training, userTrainingRole }: Props) {
  const { data: allModules } = useModules(workspaceId, trainingId);
  const searchParams = useSearchParams();
  const dayParam = searchParams.get("dayId");
  // Scope the module list to the day picked at go-live ("all"/absent = no filter)
  const modules =
    dayParam && dayParam !== "all"
      ? allModules?.filter((m) => m.dayId === dayParam)
      : allModules;
  const unlockModule = useUnlockModule(workspaceId, trainingId);
  const updateStatus = useUpdateTrainingStatus(workspaceId, trainingId);
  const resetSession = useResetSession(workspaceId, trainingId);
  const clearActiveModule = useLiveSessionStore((s) => s.setActiveModule);
  const { data: allTrainings } = useTrainings(workspaceId);
  const { data: days = [] } = useDays(workspaceId, trainingId);
  const qc = useQueryClient();

  const status = training.sessionStatus;
  // The lingering session blocking this one (status never auto-clears when a
  // trainer just closes the tab — so surface it and let them stop it in one tap).
  const otherActiveSession = allTrainings?.find(
    (t) => t.id !== trainingId && ["connecting", "live", "paused"].includes(t.sessionStatus)
  );
  const hasOtherActiveSession = !!otherActiveSession;
  const stopOtherSession = useUpdateTrainingStatus(workspaceId, otherActiveSession?.id ?? "");
  // Multi-day training must have a day chosen before opening for joining
  const needsDayPick = status === "draft" && days.length > 0 && !dayParam;

  return (
    <div className="p-4 space-y-5">

      {/* Session control */}
      <RoleGate
        role={userTrainingRole}
        permission="pause_room"
        fallback={
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-[12px] text-gray-400 text-center">
              You don't have session control permissions.
            </p>
          </div>
        }
      >
        <div>
          <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Session
          </p>
          <div className="space-y-2">
            {/* ── DRAFT: let participants connect first ── */}
            {status === "draft" && (
              <div className="space-y-2">
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 text-center">
                  <p className="text-[11.5px] text-gray-400 font-medium">Session not started</p>
                </div>
                {otherActiveSession && (
                  <div className="space-y-1.5 p-2.5 bg-red-50 text-red-700 rounded-lg">
                    <div className="flex items-start gap-1.5 text-[11px] leading-tight font-medium">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>
                        “{otherActiveSession.title}” is still active. Stop it to open this one.
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        stopOtherSession.mutate("completed", {
                          onSuccess: () => qc.invalidateQueries({ queryKey: ["trainings", workspaceId] }),
                        })
                      }
                      disabled={stopOtherSession.isPending}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-red-600 text-white text-[11.5px] font-semibold rounded-lg hover:bg-red-700 active:scale-[.98] transition-all disabled:opacity-50"
                    >
                      <Square size={12} strokeWidth={2.5} />
                      {stopOtherSession.isPending ? "Stopping…" : "Stop that session"}
                    </button>
                  </div>
                )}
                {needsDayPick && (
                  <div className="flex items-start gap-1.5 p-2 bg-blue-50 text-blue-700 rounded-lg text-[11px] leading-tight font-medium">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    Choose which day to run from the canvas before opening.
                  </div>
                )}
                <button
                  onClick={() => updateStatus.mutate("connecting")}
                  disabled={updateStatus.isPending || hasOtherActiveSession || needsDayPick}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white text-[13px] font-semibold rounded-xl hover:bg-brand-700 active:scale-[.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Users size={14} strokeWidth={2.5} />
                  Open for Joining
                </button>
              </div>
            )}

            {/* ── CONNECTING: participants joining, ready to start ── */}
            {status === "connecting" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                  <p className="text-[11.5px] text-blue-700 font-medium">Open — participants can join</p>
                </div>
                <button
                  onClick={() => updateStatus.mutate("live")}
                  disabled={updateStatus.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-[13px] font-semibold rounded-xl hover:bg-green-700 active:scale-[.98] transition-all disabled:opacity-50"
                >
                  <Play size={14} strokeWidth={2.5} />
                  Start Session
                </button>
              </div>
            )}

            {status === "live" && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus.mutate("paused")}
                  disabled={updateStatus.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 text-white text-[12px] font-semibold rounded-xl hover:bg-amber-600 active:scale-[.98] transition-all disabled:opacity-50"
                >
                  <Pause size={13} strokeWidth={2.5} />
                  Pause
                </button>
                <button
                  onClick={() => updateStatus.mutate("completed")}
                  disabled={updateStatus.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500 text-white text-[12px] font-semibold rounded-xl hover:bg-red-600 active:scale-[.98] transition-all disabled:opacity-50"
                >
                  <Square size={13} strokeWidth={2.5} />
                  End
                </button>
              </div>
            )}
            {status === "paused" && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus.mutate("live")}
                  disabled={updateStatus.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white text-[12px] font-semibold rounded-xl hover:bg-green-700 active:scale-[.98] transition-all disabled:opacity-50"
                >
                  <RotateCcw size={13} strokeWidth={2.5} />
                  Resume
                </button>
                <button
                  onClick={() => updateStatus.mutate("completed")}
                  disabled={updateStatus.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500 text-white text-[12px] font-semibold rounded-xl hover:bg-red-600 active:scale-[.98] transition-all disabled:opacity-50"
                >
                  <Square size={13} strokeWidth={2.5} />
                  End
                </button>
              </div>
            )}
            {status === "completed" && (
              <div className="space-y-2">
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-center">
                  <p className="text-[12px] text-gray-500 font-medium">Session completed</p>
                </div>
                <button
                  onClick={() => {
                    resetSession.mutate(undefined, {
                      onSuccess: () => clearActiveModule(null),
                    });
                  }}
                  disabled={resetSession.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 text-white text-[13px] font-semibold rounded-xl hover:bg-brand-700 active:scale-[.98] transition-all disabled:opacity-50"
                >
                  <RefreshCw size={14} strokeWidth={2.5} />
                  Start New Session
                </button>
              </div>
            )}
          </div>
        </div>
      </RoleGate>

      {/* Module unlock */}
      <RoleGate
        role={userTrainingRole}
        permission="unlock_modules"
        fallback={
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-[12px] text-gray-400 text-center">
              You can't unlock modules.
            </p>
          </div>
        }
      >
        <div>
          <p className="text-[10.5px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Modules
          </p>
          {!modules?.length ? (
            <p className="text-[12px] text-gray-400 px-1">No modules added yet.</p>
          ) : (
            <div className="space-y-1.5">
              {modules.map((m, i) => {
                const isActive = training.currentActiveModuleId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => unlockModule.mutate(m.id)}
                    disabled={isActive}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] font-medium transition-all text-left",
                      isActive
                        ? "bg-brand-50 border border-brand-200 text-brand-700"
                        : m.isUnlocked
                        ? "bg-gray-50 border border-gray-100 text-gray-500 cursor-default"
                        : "bg-white border border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[.98]",
                    )}
                  >
                    {isActive ? (
                      <PlayCircle size={14} className="text-brand-500 flex-shrink-0" strokeWidth={2} />
                    ) : m.isUnlocked ? (
                      <Unlock size={14} className="text-gray-400 flex-shrink-0" strokeWidth={2} />
                    ) : (
                      <Lock size={14} className="text-gray-300 flex-shrink-0" strokeWidth={2} />
                    )}
                    <span className="truncate">
                      {i + 1}. {m.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </RoleGate>
    </div>
  );
}
