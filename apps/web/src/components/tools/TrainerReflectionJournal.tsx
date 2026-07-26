"use client";

import { useState } from "react";
import { useModuleResponses } from "@/hooks/useModuleResponses";
import { responseDataOf, type TrainingModule, type ReflectionComment } from "@oruclass/types";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import { useQueryClient } from "@tanstack/react-query";
import {  Clock,
  CheckCircle2,
} from "lucide-react";
import { SafeHTML } from "@/components/ui/SafeHTML";
import { MessageCircle, Send, Maximize2, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerReflectionJournal({ module, trainingId }: Props) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);
  const queryClient = useQueryClient();

  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewContent, setPreviewContent] = useState<{title: string; html: string} | null>(null);

  const handleAddComment = async (responseId: string) => {
    if (!commentText.trim() || !workspaceId) return;
    try {
      setIsSubmitting(true);
      await apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${module.id}/responses/${responseId}/comments`,
        { text: commentText },
        { headers: { "X-Workspace-ID": workspaceId } }
      );
      setCommentText("");
      setCommentingOn(null);
      queryClient.invalidateQueries({ queryKey: ["module-responses", trainingId, module.id] });
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{module.title} (Trainer View)</h2>
        <div className="text-sm text-gray-500 font-medium">
          {responses?.length ?? 0} Reflections
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 rounded-xl border border-gray-100 p-6 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading reflections...</div>
        ) : responses?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <p>No reflections yet.</p>
            <p className="text-sm">Participants are working on their journals.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {responses?.map((r) => {
              const reflection = responseDataOf(r.responseData, "reflection");
              const text = reflection?.text ?? "";
              const comments: ReflectionComment[] = reflection?.comments ?? [];
              const when = r.createdAt ?? r.submittedAt;
              return (
                <div key={r.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                    <div className="font-semibold text-sm text-brand-600 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-700">
                        {(r.user?.name?.[0] ?? "A").toUpperCase()}
                      </div>
                      {r.user?.name ?? "Anonymous Participant"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(when).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="relative max-h-[120px] overflow-hidden rounded-md group">
                    <SafeHTML html={text || "No content"} className="text-gray-700 text-sm" />
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    <button
                      onClick={() => setPreviewContent({ title: r.user?.name ?? "Participant", html: text })}
                      className="absolute bottom-1 right-1 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm text-gray-500 hover:text-brand-600 hover:border-brand-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10"
                      title="View full response"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>

                  {comments.length > 0 && (
                    <div className="space-y-2 mt-2 bg-gray-50 p-3 rounded-md border border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comments</p>
                      {comments.map((c) => (
                        <div key={c.id} className="text-sm">
                          <span className="font-medium text-brand-700">{c.trainerName}: </span>
                          <span className="text-gray-700">{c.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    {commentingOn === r.id ? (
                      <div className="flex items-start gap-2">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Type a comment..."
                          className="flex-1 text-sm border border-gray-100 rounded-md p-2 focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleAddComment(r.id)}
                            disabled={!commentText.trim() || isSubmitting}
                            className="p-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 disabled:opacity-50 transition-colors"
                          >
                            <Send size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setCommentingOn(null);
                              setCommentText("");
                            }}
                            className="p-1 text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCommentingOn(r.id)}
                        className="text-brand-600 text-sm font-medium hover:text-brand-700 flex items-center gap-1.5"
                      >
                        <MessageCircle size={16} />
                        Add Comment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog.Root open={!!previewContent} onOpenChange={(open) => !open && setPreviewContent(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 shadow-xl w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <Dialog.Title className="text-lg font-bold text-gray-900">
                {previewContent?.title}'s Reflection
              </Dialog.Title>
              <Dialog.Close className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
            <div className="prose prose-sm max-w-none">
              <SafeHTML html={previewContent?.html || ""} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
