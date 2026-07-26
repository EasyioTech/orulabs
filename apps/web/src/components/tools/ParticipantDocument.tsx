"use client";

import React, { useEffect } from "react";
import type { TrainingModule, ModuleConfig } from "@oruclass/types";
import { LiveDocumentEditor } from "../live/LiveDocumentEditor";
import { useSocketSession } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth";

export function ParticipantDocument({
  module,
  trainingId,
}: {
  module: TrainingModule;
  trainingId: string;
}) {
  const config = module.config as ModuleConfig;
  const socket = useSocketSession(trainingId);
  const user = useAuthStore((s) => s.user);

  // Send an empty "viewed" response when they open the document
  // so the trainer can track who has joined the doc
  useEffect(() => {
    if (socket && user) {
      socket.emit("response:submit", {
        trainingId,
        moduleId: module.id,
        responseData: { type: "document", viewed: true },
      });
    }
  }, [socket, user, trainingId, module.id]);

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 h-full animate-in fade-in zoom-in-95 flex flex-col">
      <div className="mb-4 shrink-0">
        <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
        <p className="text-sm text-gray-500 mt-1">Collaborative Document. Everyone's edits are visible instantly.</p>
      </div>
      
      <div className="flex-1 min-h-0">
        <LiveDocumentEditor
          documentId={`${trainingId}-${module.id}`}
          initialContent={config.initialContent}
          minHeight="100%"
        />
      </div>
    </div>
  );
}
