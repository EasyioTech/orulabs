"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import { useIsTimeUp } from "@/hooks/useIsTimeUp";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

const DEFAULT_EMOJIS = ["😊", "🙂", "😐", "😕", "😟"];

export function ParticipantPulse({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const isTimeUp = useIsTimeUp();
  const emojis = module.config.pulseEmojis?.length ? module.config.pulseEmojis : DEFAULT_EMOJIS;
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const submit = async (emoji: string) => {
    setSelected(emoji);
    setIsPending(true);
    await submitResponse(module.id, { type: "pulse", emoji });
    setSubmitted(true);
    setIsPending(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center space-y-3">
          <div className="text-5xl sm:text-6xl">{selected}</div>
          <p className="font-medium text-gray-700 text-sm sm:text-base">Thanks for your feedback!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center">{module.title}</h2>
      {module.config.pulsePrompt && (
        <p className="text-gray-600 text-center text-sm sm:text-base">{module.config.pulsePrompt}</p>
      )}
      <p className="text-xs sm:text-sm text-gray-400">{isTimeUp ? "Time's up!" : "How are you feeling right now?"}</p>
      {module.config.isAnonymous && (
        <p className="text-[10px] sm:text-xs text-brand-600 font-medium flex items-center gap-1 bg-brand-50 px-2 py-1 rounded-md">
          <span className="text-sm">🔒</span> Your response is anonymous
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
        {emojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => submit(emoji)}
            disabled={isPending || isTimeUp}
            className={`text-3xl sm:text-5xl p-2 sm:p-3 rounded-xl transition-all hover:scale-125 hover:bg-gray-100 active:scale-95 disabled:opacity-60 ${
              selected === emoji ? "bg-brand-50 scale-110" : ""
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
