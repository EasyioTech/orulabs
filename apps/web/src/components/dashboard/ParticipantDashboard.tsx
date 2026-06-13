"use client";

import Link from "next/link";
import { HelpCircle, BookOpen } from "lucide-react";
import { useParticipatingSessions } from "@/hooks/useParticipant";
import { ParticipantJoin } from "./ParticipantJoin";
import { formatDate, cn } from "@oruclass/utils";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import type { DriveStep } from "driver.js";

const PARTICIPANT_TOUR: DriveStep[] = [
  {
    popover: {
      title: "Welcome! 👋",
      description: "This is where you join your trainer's live sessions.",
    },
  },
  {
    element: '[data-tour="join-code"]',
    popover: {
      title: "Join with a code",
      description: "Your trainer gives you a 6-digit code. Type it here to join.",
    },
  },
  {
    element: '[data-tour="active-sessions"]',
    popover: {
      title: "Your sessions",
      description: "Sessions you already joined show up here. Tap one to go back in.",
    },
  },
];

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

export function ParticipantDashboard() {
  const { data: allSessions, isLoading } = useParticipatingSessions();
  const sessions = allSessions?.filter(t => t.sessionStatus === "live" || t.sessionStatus === "paused") || [];
  const { startTour } = useOnboardingTour("participant-dashboard-v1", PARTICIPANT_TOUR, !isLoading);

  return (
    <div className="space-y-6">
      {/* Join + Welcome */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Welcome */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-[#dadce0] shadow-sm hover:shadow-md transition-shadow p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">Participant Dashboard</h2>
              <button
                onClick={startTour}
                className="text-gray-400 hover:text-brand-600 transition-colors"
                title="Take a tour"
              >
                <HelpCircle size={15} />
              </button>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Join a live session using the 6-digit code from your trainer, or rejoin an active session below.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Want to host sessions?{" "}
              <Link href="/login/trainer" className="text-[#1a73e8] font-medium hover:underline">
                Switch to Trainer
              </Link>
            </p>
          </div>
        </div>

        {/* Join widget */}
        <div data-tour="join-code" className="md:col-span-2">
          <ParticipantJoin />
        </div>
      </div>

      {/* Active Sessions */}
      <div data-tour="active-sessions">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Active Sessions</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !sessions.length ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#dadce0] p-12 text-center">
            <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No active sessions right now</p>
            <p className="text-xs text-gray-400 mt-1">Enter a code above to join a live training</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-[#dadce0] hover:border-[#1a73e8] shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col overflow-hidden"
              >
                {/* Colored banner */}
                <div className={cn("h-28 flex items-end px-5 pb-3", bannerColor(t.id))}>
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-sm font-semibold text-white truncate" title={t.title}>
                      {t.title}
                    </h3>
                    <span
                      className={cn(
                        "text-[11px] px-2 py-0.5 rounded-md font-semibold flex-shrink-0 ml-2",
                        t.sessionStatus === "live"
                          ? "bg-green-400/30 text-green-100 border border-green-300/30"
                          : "bg-yellow-400/30 text-yellow-100 border border-yellow-300/30"
                      )}
                    >
                      {t.sessionStatus === "live" ? "Live" : "Paused"}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1">
                  {t.creator?.name && (
                    <p className="text-xs text-gray-500 mb-1">Trainer: <span className="font-medium text-gray-700">{t.creator.name}</span></p>
                  )}
                  {t.participantJoinedAt && (
                    <p className="text-xs text-gray-400">Joined: {formatDate(new Date(t.participantJoinedAt))}</p>
                  )}

                  <div className="mt-auto pt-4">
                    <Link
                      href={`/join/${t.joinToken}`}
                      className="block w-full text-center py-2 bg-[#1a73e8] text-white rounded-md hover:bg-[#1557b0] transition-colors text-sm font-medium shadow-sm"
                    >
                      Rejoin Session
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
