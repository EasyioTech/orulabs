"use client";

import { useMemo } from "react";
import { useModuleResponses } from "@/hooks/useModuleResponses";
import { useLiveSessionStore } from "@/store/liveSession";
import type { TrainingModule } from "@oruclass/types";
import { Users, FileText } from "lucide-react";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerMapping({ module, trainingId }: Props) {
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);
  const focusAreas = module.config.mappingFocusAreas ?? [];
  const participants = useLiveSessionStore((s) => s.participants);

  const joinedCount = useMemo(
    () => Array.from(participants.values()).filter((p) => p.role === "participant").length,
    [participants],
  );

  const responseList = responses ?? [];
  const respondedCount = responseList.length;
  const completionPct = joinedCount > 0 ? Math.round((respondedCount / joinedCount) * 100) : 0;

  // Aggregate all submitted ideas by focus area
  const aggregatedIdeas = useMemo(() => {
    const map = new Map<string, { user: string; text: string }[]>();
    
    // Initialize map
    for (const area of focusAreas) {
      map.set(area.id, []);
    }

    for (const r of responseList) {
      const data = r.responseData;
      if (data?.type !== "mapping") continue;
      
      const userName = r.user?.name ?? "Anonymous";
      
      // Iterate through each focus area answer
      for (const [areaId, ideaList] of Object.entries(data.answers || {})) {
        if (!map.has(areaId)) map.set(areaId, []);
        const validIdeas = ideaList.filter(Boolean).map(text => ({ user: userName, text }));
        map.get(areaId)?.push(...validIdeas);
      }
    }
    
    return map;
  }, [responseList, focusAreas]);

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{module.title}</h2>
          <p className="text-sm text-gray-500 mt-1">Review participant mappings</p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {respondedCount} / {joinedCount}
              </div>
              <div className="text-xs text-gray-500">Submitted</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{completionPct}%</div>
              <div className="text-xs text-gray-500">Completion</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          </div>
        ) : focusAreas.length === 0 ? (
          <div className="text-center p-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-100">
            No focus areas configured for this module.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {focusAreas.map((area) => {
              const ideas = aggregatedIdeas.get(area.id) ?? [];
              return (
                <div key={area.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col max-h-[500px]">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{area.title}</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {ideas.length} ideas
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {ideas.length === 0 ? (
                      <div className="text-sm text-gray-400 italic text-center py-6">
                        No ideas mapped yet
                      </div>
                    ) : (
                      ideas.map((idea, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <p className="text-sm text-gray-800">{idea.text}</p>
                          <p className="text-xs text-gray-400 mt-2 font-medium">- {idea.user}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
