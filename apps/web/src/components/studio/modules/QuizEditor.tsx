import React, { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, X, ToggleLeft, ToggleRight, LayoutTemplate, ListChecks, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { TrainingModule, ModuleConfig, FormField, FormFieldType } from "@oruclass/types";

export function QuizEditor({ module, config, onChange }: { module: TrainingModule; config: any; onChange: (c: any) => void }) {
  const questions = config.questions ?? [];
    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Questions</p>
          <button
            onClick={() =>
              onChange({
                ...config,
                questions: [
                  ...questions,
                  { id: crypto.randomUUID(), text: "", type: "multiple_choice", options: ["", ""] },
                ],
              })
            }
            className="flex items-center gap-1 text-sm text-[#1a73e8] hover:text-[#1557b0] font-medium"
          >
            <Plus size={12} />
            Add question
          </button>
        </div>
        {questions.length === 0 && (
          <div className="py-6 text-center bg-gray-50 rounded border border-dashed border-gray-100">
            <ListChecks size={20} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No questions yet. Add one above.</p>
          </div>
        )}
        {questions.map((q: any, qi: number) => (
          <div key={q.id} className="bg-white rounded-lg border border-[#dadce0] p-4 space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-bold text-gray-400 bg-white border border-gray-100 rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">
                Q{qi + 1}
              </span>
              <input
                value={q.text}
                onChange={(e) => {
                  const updated = questions.map((x: any, i: number) => (i === qi ? { ...x, text: e.target.value } : x));
                  onChange({ ...config, questions: updated });
                }}
                className="flex-1 px-4 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                placeholder="Question text"
              />
              <button
                onClick={() => onChange({ ...config, questions: questions.filter((_: any, i: number) => i !== qi) })}
                className="text-gray-300 hover:text-red-500 mt-0.5 shrink-0 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <select
              value={q.type}
              onChange={(e) => {
                const updated = questions.map((x: any, i: number) =>
                  i === qi ? { ...x, type: e.target.value as typeof q.type } : x,
                );
                onChange({ ...config, questions: updated });
              }}
              className="w-full px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="short_answer">Short Answer</option>
              <option value="true_false">True / False</option>
              <option value="metric_rating">Metric Rating</option>
            </select>
            {q.type === "multiple_choice" && (
              <div className="space-y-1.5 pl-1">
                {(q.options ?? []).map((opt: any, oi: number) => {
                  const isCorrect = !!opt && q.correctAnswer === opt;
                  return (
                    <div key={oi} className="flex gap-1.5 items-center">
                      <button
                        type="button"
                        title={isCorrect ? "Correct answer" : "Mark as correct"}
                        onClick={() => {
                          const updated = questions.map((x: any, i: number) =>
                            i === qi ? { ...x, correctAnswer: opt } : x,
                          );
                          onChange({ ...config, questions: updated });
                        }}
                        className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                          isCorrect ? "bg-emerald-500 border-emerald-500" : "border-gray-300 hover:border-emerald-400"
                        }`}
                      />
                      <input
                        value={opt}
                        onChange={(e) => {
                          const opts = (q.options ?? []).map((o: any, i: number) => (i === oi ? e.target.value : o));
                          const updated = questions.map((x: any, i: number) =>
                            i === qi
                              ? {
                                  ...x,
                                  options: opts,
                                  correctAnswer: x.correctAnswer === opt ? e.target.value : x.correctAnswer,
                                }
                              : x,
                          );
                          onChange({ ...config, questions: updated });
                        }}
                        className="flex-1 px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
                        placeholder={`Option ${oi + 1}`}
                      />
                      <button
                        onClick={() => {
                          const opts = (q.options ?? []).filter((_: any, i: number) => i !== oi);
                          const updated = questions.map((x: any, i: number) =>
                            i === qi
                              ? {
                                  ...x,
                                  options: opts,
                                  correctAnswer: x.correctAnswer === opt ? undefined : x.correctAnswer,
                                }
                              : x,
                          );
                          onChange({ ...config, questions: updated });
                        }}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => {
                    const opts = [...(q.options ?? []), ""];
                    const updated = questions.map((x: any, i: number) => (i === qi ? { ...x, options: opts } : x));
                    onChange({ ...config, questions: updated });
                  }}
                  className="text-xs text-[#1a73e8] hover:text-[#1557b0] font-medium flex items-center gap-1 ml-5"
                >
                  <Plus size={11} /> Add option
                </button>
                <p className="text-[10px] text-gray-400 ml-5 mt-1">
                  Click the circle to mark the correct answer.
                </p>
              </div>
            )}
            {q.type === "true_false" && (
              <div className="flex gap-2 pl-1">
                {["True", "False"].map((opt: any) => {
                  const isCorrect = q.correctAnswer === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const updated = questions.map((x: any, i: number) =>
                          i === qi ? { ...x, correctAnswer: opt } : x,
                        );
                        onChange({ ...config, questions: updated });
                      }}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                        isCorrect
                          ? "bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8]"
                          : "bg-white border-[#dadce0] text-gray-700 hover:bg-[#f8f9fa]"
                      }`}
                    >
                      {isCorrect ? `✓ ${opt} (correct)` : opt}
                    </button>
                  );
                })}
              </div>
            )}
            {q.type === "metric_rating" && (
              <div className="flex items-center gap-3 pl-1">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-medium text-gray-600">Min</label>
                  <input
                    type="number"
                    value={q.minVal ?? 1}
                    onChange={(e) => {
                      const updated = questions.map((x: any, i: number) =>
                        i === qi ? { ...x, minVal: Number(e.target.value) } : x,
                      );
                      onChange({ ...config, questions: updated });
                    }}
                    className="w-16 px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-medium text-gray-600">Max</label>
                  <input
                    type="number"
                    value={q.maxVal ?? 10}
                    onChange={(e) => {
                      const updated = questions.map((x: any, i: number) =>
                        i === qi ? { ...x, maxVal: Number(e.target.value) } : x,
                      );
                      onChange({ ...config, questions: updated });
                    }}
                    className="w-16 px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
}
