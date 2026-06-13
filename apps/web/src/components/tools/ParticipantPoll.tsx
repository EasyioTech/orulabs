"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import { useIsTimeUp } from "@/hooks/useIsTimeUp";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantPoll({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const isTimeUp = useIsTimeUp();
  const options = module.config.pollOptions ?? [];
  const allowMultiple = module.config.allowMultiple ?? false;
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const toggle = (opt: string) => {
    if (allowMultiple) {
      setSelected((prev) => (prev.includes(opt) ? prev.filter((s) => s !== opt) : [...prev, opt]));
    } else {
      setSelected([opt]);
    }
  };

  const submit = async () => {
    setIsPending(true);
    await submitResponse(module.id, { type: "poll", selected });
    setSubmitted(true);
    setIsPending(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-4xl">✓</div>
          <p className="font-medium text-gray-700">Vote submitted!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
      {module.config.pollQuestion && (
        <p className="text-gray-600">{module.config.pollQuestion}</p>
      )}
      {allowMultiple && (
        <p className="text-xs text-gray-400">You can select multiple options.</p>
      )}

      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            disabled={isTimeUp}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
              selected.includes(opt)
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-gray-100 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={selected.length === 0 || isPending || isTimeUp}
        className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isTimeUp ? "Time's up!" : isPending ? "Submitting…" : "Submit Vote"}
      </button>
    </div>
  );
}
