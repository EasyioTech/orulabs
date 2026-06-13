"use client";

import { useModuleResponses } from "@/hooks/useModuleResponses";
import { responseDataOf, type TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerPoll({ module, trainingId }: Props) {
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);
  const options = module.config.pollOptions ?? [];

  // Tally votes
  const tally: Record<string, number> = {};
  for (const opt of options) tally[opt] = 0;
  const totalVoters = responses?.length ?? 0;
  responses?.forEach((r) => {
    const selected = responseDataOf(r.responseData, "poll")?.selected ?? [];
    selected.forEach((s) => {
      if (s in tally) tally[s]++;
    });
  });
  const maxVotes = Math.max(1, ...Object.values(tally));

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{module.title} (Trainer View)</h2>
        <div className="text-sm text-gray-500 font-medium">{totalVoters} Votes</div>
      </div>

      {module.config.pollQuestion && (
        <p className="text-gray-600 mb-4">{module.config.pollQuestion}</p>
      )}

      <div className="flex-1 overflow-auto space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading results...</div>
        ) : (
          options.map((opt) => {
            const count = tally[opt] ?? 0;
            const pct = totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0;
            return (
              <div key={opt} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{opt}</span>
                  <span className="text-gray-500">{count} ({pct}%)</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-lg transition-all duration-500"
                    style={{ width: `${maxVotes > 0 ? (count / maxVotes) * 100 : 0}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
