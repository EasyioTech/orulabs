"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import { useIsTimeUp } from "@/hooks/useIsTimeUp";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantMatrix({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const isTimeUp = useIsTimeUp();
  const rows = (module.config?.rows as string[]) ?? ["Row 1", "Row 2"];
  const cols = (module.config?.columns as string[]) ?? ["Column 1", "Column 2"];
  const [cells, setCells] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const submit = async () => {
    setIsPending(true);
    await submitResponse(module.id, { type: "matrix", cells });
    setSubmitted(true);
    setIsPending(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-4xl">✓</div>
          <p className="font-medium text-gray-700">Matrix submitted!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{module.title}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-100 rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 text-left" />
              {cols.map((c) => (
                <th key={c} className="border-b border-l border-gray-100 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                <td className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                  {r}
                </td>
                {cols.map((c) => (
                  <td key={c} className="border-b border-l border-gray-100 p-0">
                    <input
                      value={cells[`${r}__${c}`] ?? ""}
                      onChange={(e) =>
                        setCells((prev) => ({ ...prev, [`${r}__${c}`]: e.target.value }))
                      }
                      disabled={isTimeUp}
                      className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-inset focus:ring-1 focus:ring-brand-400 disabled:opacity-60 disabled:cursor-not-allowed"
                      placeholder="…"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={submit}
        disabled={isPending || isTimeUp}
        className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isTimeUp ? "Time's up!" : isPending ? "Submitting…" : "Submit Matrix"}
      </button>
    </div>
  );
}
