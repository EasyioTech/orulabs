"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import { useIsTimeUp } from "@/hooks/useIsTimeUp";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantWordCloud({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const isTimeUp = useIsTimeUp();
  const maxWords = module.config.maxWords ?? 5;
  const [input, setInput] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const addWord = () => {
    const w = input.trim();
    if (w && words.length < maxWords && !words.includes(w)) {
      setWords((prev) => [...prev, w]);
      setInput("");
    }
  };

  const removeWord = (w: string) => setWords((prev) => prev.filter((x) => x !== w));

  const submit = async () => {
    setIsPending(true);
    await submitResponse(module.id, { type: "wordcloud", words });
    setSubmitted(true);
    setIsPending(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-4xl">✓</div>
          <p className="font-medium text-gray-700">Words submitted!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
      {module.config.wordcloudPrompt && (
        <p className="text-gray-600">{module.config.wordcloudPrompt}</p>
      )}
      <p className="text-xs text-gray-400">Add up to {maxWords} words or short phrases.</p>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addWord()}
          maxLength={40}
          disabled={isTimeUp}
          className="flex-1 px-4 py-2.5 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
          placeholder="Type a word…"
        />
        <button
          onClick={addWord}
          disabled={!input.trim() || words.length >= maxWords || isTimeUp}
          className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          Add
        </button>
      </div>

      {words.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {words.map((w) => (
            <span key={w} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-200">
              {w}
              <button onClick={() => removeWord(w)} className="text-brand-400 hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      )}

      <button
        onClick={submit}
        disabled={words.length === 0 || isPending || isTimeUp}
        className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isTimeUp ? "Time's up!" : isPending ? "Submitting…" : "Submit Words"}
      </button>
    </div>
  );
}
