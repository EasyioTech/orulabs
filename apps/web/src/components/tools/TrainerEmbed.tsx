"use client";

import { useMemo } from "react";
import { useModuleResponses } from "@/hooks/useModuleResponses";
import { useLiveSessionStore } from "@/store/liveSession";
import type { TrainingModule } from "@oruclass/types";
import { Users, Eye, CheckCircle2 } from "lucide-react";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerEmbed({ module, trainingId }: Props) {
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);
  const embeds = module.config.embeds?.length 
    ? module.config.embeds 
    : (module.config.embedUrl ? [{ id: 'legacy', url: module.config.embedUrl, title: module.config.embedTitle, description: module.config.embedDescription }] : []);
    
  const title = module.title;
  
  const participants = useLiveSessionStore((s) => s.participants);
  const joinedCount = useMemo(
    () => Array.from(participants.values()).filter((p) => p.role === "participant").length,
    [participants],
  );

  const responseList = responses ?? [];
  const respondedCount = responseList.length;
  const completionPct = joinedCount > 0 ? Math.round((respondedCount / joinedCount) * 100) : 0;

  const viewers = useMemo(() => {
    return responseList
      .filter((r) => r.responseData?.type === "embed" && r.responseData.viewed)
      .map((r) => r.user?.name ?? "Anonymous");
  }, [responseList]);

  if (embeds.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-100">
          No embedded resources have been configured for this module.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-gray-50">
      {/* Left side: The Embed */}
      <div className="flex-1 h-full border-r border-gray-100 relative bg-gray-100 overflow-y-auto p-4 md:p-8 space-y-8">
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

      {/* Right side: Analytics */}
      <div className="w-full md:w-80 h-full flex flex-col bg-white">
        <div className="p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
          <p className="text-xs text-gray-500">Live Viewership</p>
          
          <div className="mt-6 flex gap-3">
            <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Viewers</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">{respondedCount}</span>
            </div>
            <div className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Rate</span>
              </div>
              <span className="font-bold text-brand-600 text-lg">{completionPct}%</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Viewed By</h3>
          
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
            </div>
          ) : viewers.length === 0 ? (
            <div className="text-center p-6 text-sm text-gray-400 italic">
              No participants have marked this as viewed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {viewers.map((viewer, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm font-medium text-gray-700 truncate">{viewer}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
