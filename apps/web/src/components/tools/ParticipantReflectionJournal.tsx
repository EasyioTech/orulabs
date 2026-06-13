"use client";

import { useState, useEffect } from "react";
import { SafeHTML } from "@/components/ui/SafeHTML";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import { useIsTimeUp } from "@/hooks/useIsTimeUp";
import { useMyModuleResponse } from "@/hooks/useMyModuleResponse";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { responseDataOf, type TrainingModule, type ReflectionComment } from "@oruclass/types";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantReflectionJournal({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const isTimeUp = useIsTimeUp();
  const { data: myResponse, isLoading } = useMyModuleResponse(trainingId, module.id);
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  // Pre-fill text if we have a past response
  useEffect(() => {
    const reflection = responseDataOf(myResponse?.responseData, "reflection");
    if (reflection?.text) {
      setText(reflection.text);
      setIsEditing(false);
    }
  }, [myResponse]);

  const submit = async () => {
    setIsPending(true);
    const prior = responseDataOf(myResponse?.responseData, "reflection");
    await submitResponse(module.id, { type: "reflection", text, comments: prior?.comments ?? [] });
    // Invalidate the query to fetch the new updated response
    queryClient.invalidateQueries({ queryKey: ["my-module-response", trainingId, module.id] });
    setIsEditing(false);
    setIsPending(false);
  };

  if (isLoading) {
    return <div className="p-6 text-center text-gray-400">Loading your journal...</div>;
  }

  const existingComments: ReflectionComment[] = responseDataOf(myResponse?.responseData, "reflection")?.comments ?? [];

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto flex flex-col h-full">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
        Your reflection is private and visible only to the trainer.
      </div>

      {!isEditing && myResponse ? (
        <div className="flex-1 overflow-auto space-y-6">
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Entry</h3>
            <SafeHTML html={text || "No content"} className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap" />
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsEditing(true)}
                disabled={isTimeUp}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit Entry
              </button>
            </div>
          </div>

          {existingComments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Trainer Feedback</h3>
              {existingComments.map((c) => (
                <div key={c.id} className="bg-brand-50 border border-brand-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-brand-800 text-sm">{c.trainerName}</span>
                    <span className="text-xs text-brand-600/60">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-brand-900">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <RichTextEditor
            value={text}
            onChange={setText}
            placeholder="Write your reflection here…"
            minHeight="200px"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={submit}
              disabled={!text.trim() || isPending || isTimeUp}
              className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isTimeUp ? "Time's up!" : isPending ? "Saving…" : "Save Reflection"}
            </button>
            {myResponse && (
              <button
                onClick={() => {
                  setText(responseDataOf(myResponse.responseData, "reflection")?.text || "");
                  setIsEditing(false);
                }}
                disabled={isPending}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
