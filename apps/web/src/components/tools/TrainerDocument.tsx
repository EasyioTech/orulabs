"use client";

import React from "react";
import type { TrainingModule, ModuleConfig } from "@oruclass/types";
import { LiveDocumentEditor } from "../live/LiveDocumentEditor";
import { useLiveSessionStore } from "@/store/liveSession";

export function TrainerDocument({
  module,
  trainingId,
}: {
  module: TrainingModule;
  trainingId: string;
}) {
  const config = module.config as ModuleConfig;
  const responseCounts = useLiveSessionStore((s) => s.responseCounts);
  const activeCount = responseCounts.get(module.id) || 0;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 h-full animate-in fade-in zoom-in-95 flex flex-col">
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
          <p className="text-sm text-gray-500 mt-1">Collaborative Document. You are a live editor.</p>
        </div>
        <div className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-200">
          {activeCount} participants viewing
        </div>
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
