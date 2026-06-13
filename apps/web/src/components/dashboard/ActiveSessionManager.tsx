"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTrainings, useUpdateTrainingStatus } from "@/hooks/useTrainings";
import { StopCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Training } from "@oruclass/types";

function ActiveSessionWidget({ workspaceId, training }: { workspaceId: string; training: Training }) {
  const router = useRouter();
  const updateStatus = useUpdateTrainingStatus(workspaceId, training.id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white border border-gray-100 shadow-md rounded-xl p-3 pr-4 cursor-pointer hover:shadow-lg transition-shadow group"
        onClick={() => router.push(`/workspaces/${workspaceId}/trainings/${training.id}/live`)}
      >
        {/* Pulsing indicator */}
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-50 flex-shrink-0 relative">
          <span className="absolute inset-0 rounded-lg bg-brand-200 animate-ping opacity-50" />
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest leading-none mb-0.5">
            Live
          </span>
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">
            {training.title}
          </span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); updateStatus.mutate("completed"); }}
          disabled={updateStatus.isPending}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50 flex-shrink-0"
          title="Stop Session"
        >
          <StopCircle size={17} />
        </button>
        <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0" />
      </motion.div>
    </AnimatePresence>
  );
}

export function ActiveSessionManager() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { data: trainings } = useTrainings(workspaceId);

  const activeTraining = useMemo(
    () => trainings?.find(t => ["connecting", "live", "paused"].includes(t.sessionStatus)) ?? null,
    [trainings]
  );

  if (!activeTraining) return null;
  return <ActiveSessionWidget workspaceId={workspaceId} training={activeTraining} />;
}
