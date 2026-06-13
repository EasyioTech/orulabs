"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import { useIsTimeUp } from "@/hooks/useIsTimeUp";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantMapping({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const isTimeUp = useIsTimeUp();
  const focusAreas = module.config.mappingFocusAreas ?? [];
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleInputChange = (areaId: string, index: number, value: string) => {
    setAnswers((prev) => {
      const areaAnswers = prev[areaId] ? [...prev[areaId]] : Array(focusAreas.find((f) => f.id === areaId)?.numFields ?? 0).fill("");
      areaAnswers[index] = value;
      return { ...prev, [areaId]: areaAnswers };
    });
  };

  const submit = async () => {
    setIsPending(true);
    await submitResponse(module.id, { type: "mapping", answers });
    setSubmitted(true);
    setIsPending(false);
  };

  const isFormValid = () => {
    // Check if at least one input has been filled across all focus areas
    return Object.values(answers).some((areaAnswers) =>
      areaAnswers.some((ans) => ans.trim().length > 0)
    );
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-4xl">✅</div>
          <p className="font-medium text-gray-700">Mapping submitted!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto h-full overflow-y-auto pb-24">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">{module.title}</h2>
        <p className="text-gray-600">Connect your ideas to the relevant focus areas below.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {focusAreas.map((area) => (
          <div key={area.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">{area.title}</h3>
            <div className="space-y-3">
              {Array.from({ length: area.numFields }).map((_, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Idea ${index + 1}`}
                  value={answers[area.id]?.[index] ?? ""}
                  onChange={(e) => handleInputChange(area.id, index, e.target.value)}
                  disabled={isTimeUp}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
              ))}
            </div>
          </div>
        ))}
        
        {focusAreas.length === 0 && (
          <div className="col-span-full text-center p-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-100">
            No focus areas configured for this mapping exercise.
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg flex justify-center z-10">
        <div className="w-full max-w-4xl px-2">
          <button
            onClick={submit}
            disabled={!isFormValid() || isPending || isTimeUp}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isTimeUp ? "Time's up!" : isPending ? "Submitting..." : "Submit Mapping"}
          </button>
        </div>
      </div>
    </div>
  );
}
