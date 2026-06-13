"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import type { TrainingModule } from "@oruclass/types";
import { CheckCircle } from "lucide-react";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantEmbed({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const embeds = module.config.embeds?.length 
    ? module.config.embeds 
    : (module.config.embedUrl ? [{ id: 'legacy', url: module.config.embedUrl, title: module.config.embedTitle, description: module.config.embedDescription }] : []);
    
  const title = module.title;

  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const markAsViewed = async () => {
    setIsPending(true);
    await submitResponse(module.id, { type: "embed", viewed: true });
    setSubmitted(true);
    setIsPending(false);
  };

  if (embeds.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-100">
          No embedded resources have been configured for this module.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-4 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between shrink-0 z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 line-clamp-1">{embeds.length} resource{embeds.length !== 1 && 's'} to review</p>
        </div>
        <div>
          {submitted ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg font-medium text-sm">
              <CheckCircle className="w-5 h-5" />
              <span>Viewed</span>
            </div>
          ) : (
            <button
              onClick={markAsViewed}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors text-sm shadow-sm shrink-0"
            >
              {isPending ? "Updating..." : "Mark as Viewed"}
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 w-full bg-gray-100 overflow-y-auto p-4 md:p-8 space-y-8">
        {embeds.map((embed, index) => (
          <div key={embed.id || index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {(embed.title || embed.description) && (
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                {embed.title && <h3 className="font-bold text-gray-900">{embed.title}</h3>}
                {embed.description && <p className="text-sm text-gray-600 mt-1">{embed.description}</p>}
              </div>
            )}
            <div className="w-full aspect-video relative bg-gray-900">
              <iframe
                src={embed.url}
                className="absolute inset-0 w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={embed.title || `Embedded Resource ${index + 1}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
