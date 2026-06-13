"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import { useIsTimeUp } from "@/hooks/useIsTimeUp";
import type { TrainingModule, QuizQuestion } from "@oruclass/types";
import { cn } from "@oruclass/utils";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantQuiz({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const questions = (module.config?.questions ?? []) as QuizQuestion[];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const isTimeUp = useIsTimeUp();

  const set = (qid: string, val: string) =>
    setAnswers((prev) => ({ ...prev, [qid]: val }));

  const submit = async () => {
    setIsPending(true);
    // Wrap in tagged shape so trainer can discriminate quiz responses.
    await submitResponse(module.id, { type: "quiz", answers });
    setSubmitted(true);
    setIsPending(false);
  };

  if (submitted) {
    const correct = questions.filter((q) => q.correctAnswer && answers[q.id] === q.correctAnswer).length;
    const gradable = questions.filter((q) => !!q.correctAnswer).length;
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="text-5xl">✓</div>
          <p className="font-semibold text-gray-800">Response submitted!</p>
          {gradable > 0 && (
            <p className="text-sm text-gray-600">
              You got <span className="font-bold text-brand-700">{correct}</span> / {gradable} correct
            </p>
          )}
        </div>
      </div>
    );
  }

  const allAnswered = questions.every((q) => (answers[q.id] ?? "").trim().length > 0);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
        <p className="text-xs text-gray-500 mt-1">{questions.length} question{questions.length === 1 ? "" : "s"}</p>
      </div>

      <div className="space-y-5">
        {questions.map((q, idx) => (
          <div key={q.id} className="space-y-2">
            <p className="font-medium text-gray-800">
              <span className="text-xs font-bold text-brand-600 mr-2">Q{idx + 1}.</span>
              {q.text}
            </p>
            {q.type === "multiple_choice" && q.options ? (
              <div className="space-y-1.5">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => set(q.id, opt)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors",
                      answers[q.id] === opt
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-100 hover:bg-gray-50",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : q.type === "true_false" ? (
              <div className="grid grid-cols-2 gap-2">
                {["True", "False"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => set(q.id, opt)}
                    className={cn(
                      "px-4 py-3 rounded-lg border text-sm font-medium transition-colors",
                      answers[q.id] === opt
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-gray-100 hover:bg-gray-50",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : q.type === "metric_rating" ? (
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                  {Array.from({ length: (q.maxVal ?? 10) - (q.minVal ?? 1) + 1 }, (_, i) => (q.minVal ?? 1) + i).map((val) => (
                    <button
                      key={val}
                      onClick={() => set(q.id, val.toString())}
                      className={cn(
                        "w-10 h-10 rounded-lg border text-sm font-medium transition-colors shrink-0",
                        answers[q.id] === val.toString()
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-gray-100 hover:bg-gray-50 text-gray-700",
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => set(q.id, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Your answer…"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={isPending || !allAnswered || questions.length === 0 || isTimeUp}
        className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isTimeUp ? "Time's up!" : isPending ? "Submitting…" : allAnswered ? "Submit" : "Answer all questions"}
      </button>
    </div>
  );
}
