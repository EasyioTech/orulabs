"use client";
import { use } from "react";
import { useWorkspaceStore } from "@/store/workspace";
import { useSessionHistory } from "@/hooks/useSessions";
import { ArrowLeft, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";

export default function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: trainingId } = use(params);
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const { data: sessions, isLoading } = useSessionHistory(workspaceId, trainingId);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <a href={`/trainings/${trainingId}/studio`} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={18} />
        </a>
        <h1 className="text-xl font-bold text-gray-900">Session History</h1>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : !sessions?.length ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No sessions run yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      s.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {s.status === "active" ? "Active" : "Completed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <Calendar size={11} />
                    {new Date(s.startedAt).toLocaleString()}
                    {s.endedAt && (
                      <> — {new Date(s.endedAt).toLocaleTimeString()}</>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <CheckCircle2 size={12} className="text-green-500" />
                    {s.uniqueRespondents} respondents
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.totalResponses} total responses</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
