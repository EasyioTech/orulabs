"use client";

import { useState } from "react";
import { useModuleResponses } from "@/hooks/useModuleResponses";
import { responseDataOf, type TrainingModule } from "@oruclass/types";
import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, X } from "lucide-react";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerQnA({ module, trainingId }: Props) {
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);
  const [previewContent, setPreviewContent] = useState<{title: string; text: string} | null>(null);

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
          responses?.flatMap((r) => {
            const data = responseDataOf(r.responseData, "qna");
            const questions: string[] = data?.questions || (data?.question ? [data.question] : []);
            const when = r.createdAt ?? r.submittedAt;
            const userName = r.user?.name ?? "Anonymous";
            
            return questions.map((q, idx) => (
              <div key={`${r.id}-${idx}`} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                  ?
                </div>
                <div className="flex-1 min-w-0 relative">
                  <div className="relative max-h-[80px] overflow-hidden rounded-md">
                    <p className="text-gray-800 text-sm whitespace-pre-wrap">{q || "No content"}</p>
                    <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  </div>
                  <button
                    onClick={() => setPreviewContent({ title: userName, text: q })}
                    className="absolute bottom-0 right-0 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm text-gray-500 hover:text-brand-600 hover:border-brand-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 translate-y-2"
                    title="View full question"
                  >
                    <Maximize2 size={14} />
                  </button>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">{new Date(when).toLocaleTimeString()}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{userName}</span>
                  </div>
                </div>
              </div>
            ));
          })
        )}
      </div>

      <Dialog.Root open={!!previewContent} onOpenChange={(open) => !open && setPreviewContent(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 shadow-xl w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <Dialog.Title className="text-lg font-bold text-gray-900">
                Question from {previewContent?.title}
              </Dialog.Title>
              <Dialog.Close className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 whitespace-pre-wrap">{previewContent?.text}</p>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
