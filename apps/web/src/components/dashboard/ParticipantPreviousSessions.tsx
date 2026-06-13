"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useParticipatingSessions } from "@/hooks/useParticipant";
import { formatDate, cn } from "@oruclass/utils";

const BANNER_COLORS = [
  "bg-[#1565C0]",
  "bg-[#2E7D32]",
  "bg-[#6A1B9A]",
  "bg-[#AD1457]",
  "bg-[#E65100]",
  "bg-[#00695C]",
  "bg-[#4527A0]",
  "bg-[#37474F]",
];

function bannerColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return BANNER_COLORS[Math.abs(hash) % BANNER_COLORS.length];
}

export function ParticipantPreviousSessions() {
  const { data: allSessions, isLoading } = useParticipatingSessions();
  const sessions = allSessions?.filter(t => t.sessionStatus === "completed") || [];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900">Previous Sessions</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review and revisit your completed trainings.
        </p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !sessions.length ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No previous sessions</p>
          <p className="text-xs text-gray-400 mt-1">Your completed trainings will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
            >
              {/* Colored banner */}
              <div className={cn("h-24 flex items-end px-4 pb-3", bannerColor(t.id))}>
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-sm font-semibold text-white truncate" title={t.title}>
                    {t.title}
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ml-2 bg-white/20 text-white/90 border border-white/20">
                    Ended
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="p-4 flex flex-col flex-1">
                {t.creator?.name && (
                  <p className="text-xs text-gray-500 mb-1">Trainer: <span className="font-medium text-gray-700">{t.creator.name}</span></p>
                )}
                {t.participantJoinedAt && (
                  <p className="text-xs text-gray-400">Joined: {formatDate(new Date(t.participantJoinedAt))}</p>
                )}

                <div className="mt-auto pt-3">
                  <Link
                    href={`/participant/training/${t.id}`}
                    className="block w-full text-center py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    View Session
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
