"use client";

import { useModules } from "@/hooks/useModules";
import { useLiveSessionStore } from "@/store/liveSession";
import { cn } from "@oruclass/utils";
import { Lock, Unlock, PlayCircle } from "lucide-react";

interface Props {
  trainingId: string;
  workspaceId: string;
}

import { useSearchParams } from "next/navigation";

export function AgendaPane({ trainingId, workspaceId }: Props) {
  const { data: allModules } = useModules(workspaceId, trainingId);
  const activeModule = useLiveSessionStore((s) => s.activeModule);
  const searchParams = useSearchParams();
  const dayId = searchParams.get("dayId");

  const modules =
    dayId && dayId !== "all"
      ? allModules?.filter((m) => m.dayId === dayId)
      : allModules;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Agenda</h3>
        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
          {modules?.length || 0} Modules
        </span>
      </div>

      {!modules?.length ? (
        <div className="py-8 text-center bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">No modules in agenda</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {modules.map((m, i) => {
            const isActive = activeModule?.id === m.id;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border transition-all",
                  isActive
                    ? "bg-brand-50 border-brand-300 shadow-sm"
                    : m.isUnlocked
                    ? "bg-white border-gray-100 hover:border-gray-300 hover:shadow-sm"
                    : "bg-gray-50 border-gray-100 opacity-60",
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isActive ? (
                    <PlayCircle size={16} className="text-brand-600" strokeWidth={2.5} />
                  ) : m.isUnlocked ? (
                    <Unlock size={16} className="text-gray-400" strokeWidth={2} />
                  ) : (
                    <Lock size={16} className="text-gray-300" strokeWidth={2} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    isActive ? "font-bold text-gray-900" : "font-medium text-gray-700"
                  )}>
                    {i + 1}. {m.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md",
                      isActive ? "bg-brand-600 text-white" : m.isUnlocked ? "bg-gray-100 text-gray-700" : "bg-gray-100 text-gray-400"
                    )}>
                      {isActive ? "Now Playing" : m.isUnlocked ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
