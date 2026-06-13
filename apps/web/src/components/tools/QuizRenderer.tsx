"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import type { TrainingModule, QuizQuestion } from "@oruclass/types";
import { cn } from "@oruclass/utils";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function QuizRenderer({ module, trainingId }: Props) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const questions = (module.config?.questions ?? []) as QuizQuestion[];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const submit = useMutation({
    mutationFn: (responseData: Record<string, unknown>) =>
      apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${module.id}/responses`,
        { responseData },
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-4xl">✓</div>
          <p className="font-medium text-gray-700">Response submitted!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
      </div>

      <div className="space-y-5">
        {questions.map((q) => (
          <div key={q.id} className="space-y-2">
            <p className="font-medium text-gray-800">{q.text}</p>
            {q.type === "multiple_choice" && q.options ? (
              <div className="space-y-1.5">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
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
            ) : (
              <textarea
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                placeholder="Your answer…"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => submit.mutate(answers)}
        disabled={submit.isPending}
        className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
      >
        {submit.isPending ? "Submitting…" : "Submit"}
      </button>
    </div>
  );
}
