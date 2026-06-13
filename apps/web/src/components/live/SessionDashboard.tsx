"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/store/workspace";
import { useLiveSessionStore } from "@/store/liveSession";
import { useCurrentSession, useSessionParticipants, useParticipantResponse, useUpdateTargetResponses } from "@/hooks/useSessions";
import type { Training } from "@oruclass/types";
import { cn } from "@oruclass/utils";
import { Users, CheckCircle2, Clock, Target, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";

interface Props {
  training: Training;
}

function ResponseDetail({
  workspaceId,
  trainingId,
  sessionId,
  userId,
  moduleId,
  name,
  onClose,
}: {
  workspaceId: string;
  trainingId: string;
  sessionId: string;
  userId: string;
  moduleId: string;
  name: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useParticipantResponse(workspaceId, trainingId, sessionId, userId, moduleId);

  return (
    <div className="border-t border-gray-100 bg-gray-50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-white">
        <span className="text-xs font-semibold text-gray-700 truncate">{name}'s response</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-0.5">
          <X size={14} />
        </button>
      </div>
      <div className="p-3">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="animate-spin text-gray-400" />
          </div>
        ) : !data ? (
          <p className="text-xs text-gray-400 text-center py-4">No response found</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                Submitted {new Date(data.submittedAt).toLocaleTimeString()}
              </p>
              {typeof data.timeSpentSeconds === "number" && (
                <p className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock size={10} />
                  {Math.floor(data.timeSpentSeconds / 60)}m {data.timeSpentSeconds % 60}s
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg border border-gray-100 p-2.5">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-sans leading-relaxed">
                {JSON.stringify(data.responseData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SessionDashboard({ training }: Props) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const trainingId = training.id;
  const activeModule = useLiveSessionStore((s) => s.activeModule);
  const sessionStats = useLiveSessionStore((s) => s.sessionStats);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<{ userId: string; name: string } | null>(null);
  const [targetInput, setTargetInput] = useState("");
  const [editingTarget, setEditingTarget] = useState(false);

  const { data: currentSessionData } = useCurrentSession(workspaceId, trainingId);
  const session = currentSessionData?.session;
  const dbStats = currentSessionData?.stats;

  // Use real-time socket stats if available, fall back to DB stats
  const submitted = sessionStats?.submitted ?? dbStats?.submitted ?? 0;
  const totalParticipants = sessionStats?.totalParticipants ?? dbStats?.totalParticipants ?? 0;
  const completionPct = totalParticipants > 0 ? Math.round((submitted / totalParticipants) * 100) : 0;
  const target = dbStats?.targetResponses ?? null;

  const updateTarget = useUpdateTargetResponses(workspaceId, trainingId);

  const { data: participantsData, isLoading: loadingParticipants } = useSessionParticipants(
    workspaceId,
    trainingId,
    session?.id ?? null,
    activeModule?.id ?? null,
    page,
  );

  const totalPages = participantsData ? Math.ceil(participantsData.total / participantsData.limit) : 1;

  if (!session) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-400 pt-6">No active session</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="p-3 space-y-2 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Joined" value={totalParticipants} icon={<Users size={12} />} color="blue" />
          <StatCard label="Submitted" value={submitted} icon={<CheckCircle2 size={12} />} color="green" />
          <StatCard label="Pending" value={Math.max(0, totalParticipants - submitted)} icon={<Clock size={12} />} color="amber" />
          <StatCard
            label="Done"
            value={`${completionPct}%`}
            icon={<Target size={12} />}
            color={completionPct === 100 ? "green" : "brand"}
          />
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, completionPct)}%` }}
          />
        </div>

        {/* Target responses */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-gray-400 font-medium">Target</span>
          {editingTarget ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = parseInt(targetInput);
                updateTarget.mutate(isNaN(n) ? null : n, { onSuccess: () => setEditingTarget(false) });
              }}
              className="flex items-center gap-1"
            >
              <input
                type="number"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-16 text-xs border border-gray-100 rounded px-1.5 py-0.5 text-right focus:outline-none focus:ring-1 focus:ring-brand-400"
                placeholder="—"
                autoFocus
                min={1}
              />
              <button type="submit" className="text-[10px] text-brand-600 font-semibold">Set</button>
              <button type="button" onClick={() => setEditingTarget(false)} className="text-[10px] text-gray-400">×</button>
            </form>
          ) : (
            <button
              onClick={() => { setTargetInput(target ? String(target) : ""); setEditingTarget(true); }}
              className="text-[10px] text-brand-600 font-semibold hover:underline tabular-nums"
            >
              {target ? `${submitted}/${target}` : "Set target"}
            </button>
          )}
        </div>
      </div>

      {/* Module context */}
      {activeModule && (
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Active module</p>
          <p className="text-[11px] text-gray-700 font-medium truncate">{activeModule.title}</p>
        </div>
      )}

      {/* Participant list */}
      <div className="flex-1 overflow-y-auto">
        {!activeModule ? (
          <p className="text-xs text-gray-400 text-center p-4 pt-6">Unlock a module to see submissions</p>
        ) : loadingParticipants ? (
          <div className="flex justify-center py-6">
            <Loader2 size={16} className="animate-spin text-gray-300" />
          </div>
        ) : !participantsData?.items.length ? (
          <p className="text-xs text-gray-400 text-center p-4 pt-6">No participants yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {participantsData.items.map((p) => (
              <div key={p.userId}>
                <button
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left",
                    selectedUser?.userId === p.userId && "bg-blue-50",
                  )}
                  onClick={() =>
                    setSelectedUser(
                      selectedUser?.userId === p.userId ? null : { userId: p.userId, name: p.name },
                    )
                  }
                  disabled={!p.hasSubmitted}
                >
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-500">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-gray-800 truncate">{p.name}</p>
                    {p.submittedAt && (
                      <p className="text-[10px] text-gray-400">{new Date(p.submittedAt).toLocaleTimeString()}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0",
                      p.hasSubmitted
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-400",
                    )}
                  >
                    {p.hasSubmitted ? "Done" : "Pending"}
                  </span>
                </button>

                {/* Inline response detail */}
                {selectedUser?.userId === p.userId && p.hasSubmitted && session && activeModule && (
                  <ResponseDetail
                    workspaceId={workspaceId}
                    trainingId={trainingId}
                    sessionId={session.id}
                    userId={p.userId}
                    moduleId={activeModule.id}
                    name={p.name}
                    onClose={() => setSelectedUser(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[10px] text-gray-400">{page}/{totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "amber" | "brand";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    brand: "bg-brand-50 text-brand-700",
  };
  return (
    <div className={cn("rounded-xl px-3 py-2.5 flex flex-col gap-1", colorMap[color])}>
      <div className="flex items-center gap-1 opacity-70">{icon}<span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span></div>
      <span className="text-xl font-bold tabular-nums leading-none">{value}</span>
    </div>
  );
}
