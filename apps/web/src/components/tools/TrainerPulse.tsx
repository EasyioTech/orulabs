"use client";

import { useMemo } from "react";
import { useModuleResponses } from "@/hooks/useModuleResponses";
import { responseDataOf, type TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

const DEFAULT_EMOJIS = ["😊", "🙂", "😐", "😕", "😟"];

export function TrainerPulse({ module, trainingId }: Props) {
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);
  const emojis = module.config.pulseEmojis?.length ? module.config.pulseEmojis : DEFAULT_EMOJIS;
  const totalResponses = responses?.length ?? 0;

  const tally = useMemo(() => {
    const counts: Record<string, number> = {};
    emojis.forEach((e) => (counts[e] = 0));
    responses?.forEach((r) => {
      const emoji = responseDataOf(r.responseData, "pulse")?.emoji;
      if (emoji && emoji in counts) counts[emoji]++;
    });
    return counts;
  }, [responses, emojis]);

  const maxCount = Math.max(1, ...Object.values(tally));

  const averageScore = useMemo(() => {
    if (totalResponses === 0) return 0;
    // Assume emojis are ordered Best -> Worst or Worst -> Best.
    // For a generic scale, we'll assign (emojis.length - index) so index 0 = N points.
    let totalScore = 0;
    responses?.forEach((r) => {
      const emoji = responseDataOf(r.responseData, "pulse")?.emoji;
      const idx = emoji ? emojis.indexOf(emoji) : -1;
      if (idx >= 0) totalScore += (emojis.length - idx);
    });
    return totalScore / totalResponses;
  }, [responses, emojis, totalResponses]);

  return (
    <div className="flex h-full flex-col p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">{module.title} (Trainer View)</h2>
        <div className="flex gap-4">
          <div className="text-sm font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-lg">
            Avg Score: {averageScore.toFixed(1)} / {emojis.length}
          </div>
          <div className="text-sm text-gray-500 font-medium py-1">{totalResponses} Responses</div>
        </div>
      </div>

      {module.config.pulsePrompt && (
        <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{module.config.pulsePrompt}</p>
      )}

      <div className="flex-1 flex items-center justify-center">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 items-end">
            {emojis.map((emoji) => {
              const count = tally[emoji] ?? 0;
              const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
              return (
                <div key={emoji} className="flex flex-col items-center gap-1 sm:gap-2" style={{ minWidth: 48 }}>
                  <span className="text-xs sm:text-sm font-bold text-gray-600">{pct}%</span>
                  <div className="w-10 sm:w-16 bg-gray-100 rounded-xl relative h-[100px] sm:h-[160px]">
                    <div
                      className="absolute bottom-0 w-full bg-brand-400 rounded-xl transition-all duration-500"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  </div>
                  <span className="text-2xl sm:text-3xl">{emoji}</span>
                  <span className="text-xs text-gray-500 font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
