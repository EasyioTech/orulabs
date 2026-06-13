"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function MatrixEditor({ module, trainingId }: Props) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const rows = (module.config?.rows as string[]) ?? ["Row 1", "Row 2"];
  const cols = (module.config?.columns as string[]) ?? ["Column 1", "Column 2"];
  const [cells, setCells] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${module.id}/responses`,
        { responseData: { cells } },
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => setSubmitted(true),
  });

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
                      className="w-full px-3 py-2 text-sm focus:outline-none focus:ring-inset focus:ring-1 focus:ring-brand-400"
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
        onClick={() => submit.mutate()}
        disabled={submit.isPending}
        className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
      >
        {submit.isPending ? "Submitting…" : "Submit Matrix"}
      </button>
    </div>
  );
}
