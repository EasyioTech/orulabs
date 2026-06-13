"use client";

import { useModuleResponses } from "@/hooks/useModuleResponses";
import { responseDataOf, type TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerQnA({ module, trainingId }: Props) {
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{module.title} (Trainer View)</h2>
        <div className="text-sm text-gray-500 font-medium">{responses?.length ?? 0} Questions</div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 rounded-xl border border-gray-100 p-6 space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading questions...</div>
        ) : responses?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <p>No questions yet.</p>
            <p className="text-sm">Participants can submit questions anonymously.</p>
          </div>
        ) : (
          responses?.map((r) => {
            const question = responseDataOf(r.responseData, "qna")?.question ?? "";
            const when = r.createdAt ?? r.submittedAt;
            return (
              <div key={r.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                  ?
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm">{question || "No content"}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">{new Date(when).toLocaleTimeString()}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{r.user?.name ?? "Anonymous"}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
