"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import { useIsTimeUp } from "@/hooks/useIsTimeUp";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantQnA({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const isTimeUp = useIsTimeUp();
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const submit = async () => {
    setIsPending(true);
    await submitResponse(module.id, { type: "qna", question: question.trim() });
    setSubmitted(true);
    setIsPending(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-4xl">✓</div>
          <p className="font-medium text-gray-700">Question submitted!</p>
          <button
            onClick={() => { setSubmitted(false); setQuestion(""); }}
            className="text-sm text-brand-600 hover:text-brand-800 font-medium"
          >
            Ask another question
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
      {module.config.qnaPrompt && (
        <p className="text-gray-600">{module.config.qnaPrompt}</p>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        Your question is anonymous — only the trainer can see who asked.
      </div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        rows={4}
        maxLength={500}
        disabled={isTimeUp}
        className="w-full px-4 py-3 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
        placeholder="Type your question here…"
      />

      <button
        onClick={submit}
        disabled={!question.trim() || isPending || isTimeUp}
        className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isTimeUp ? "Time's up!" : isPending ? "Submitting…" : "Submit Question"}
      </button>
    </div>
  );
}
