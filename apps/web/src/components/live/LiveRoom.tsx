"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/workspace";
import { useAuthStore } from "@/store/auth";
import { useMyTrainingRole } from "@/hooks/useTrainings";
import { TrainerLiveRoom } from "./TrainerLiveRoom";
import { ParticipantLiveRoom } from "./ParticipantLiveRoom";

/**
 * Gate component that waits for Zustand store hydration + role fetch
 * before deciding which live room to render.
 *
 * Without this, on hard refresh the workspace store is briefly null
 * (before persist rehydrates) → useMyTrainingRole returns null/participant
 * → admin sees participant view.
 */
export function LiveRoom({
  trainingId,
  forceParticipant,
}: {
  trainingId: string;
  forceParticipant?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  // Track whether Zustand persist has rehydrated yet
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // After the first render cycle, persist middleware has synced from localStorage
    setHydrated(true);
  }, []);

  // Determine role — only meaningful once workspace is available
  const role = useMyTrainingRole(activeWorkspaceId ?? "", trainingId);

  // Wait for hydration + auth before anything
  if (!hydrated || !user) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  // forceParticipant (QR/link join) — skip role resolution entirely.
  // QR-joined users have no activeWorkspaceId so useMyTrainingRole would
  // return null forever. We already know they're participants.
  if (forceParticipant) {
    return <ParticipantLiveRoom trainingId={trainingId} />;
  }

  // For trainer path, wait for role resolution
  if (role === null) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
          <p className="text-[13px] text-gray-400 font-medium">Loading session…</p>
        </div>
      </div>
    );
  }

  if (role !== "participant") {
    return <TrainerLiveRoom trainingId={trainingId} />;
  }

  return <ParticipantLiveRoom trainingId={trainingId} />;
}
