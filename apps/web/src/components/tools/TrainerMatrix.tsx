"use client";

import { useModuleResponses } from "@/hooks/useModuleResponses";
import { responseDataOf, type TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerMatrix({ module, trainingId }: Props) {
  const rows = (module.config?.rows as string[]) ?? ["Row 1", "Row 2"];
  const cols = (module.config?.columns as string[]) ?? ["Column 1", "Column 2"];

  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{module.title} (Trainer View)</h2>
        <div className="text-sm text-gray-500 font-medium">
          {responses?.length ?? 0} Responses
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50 rounded-xl border border-gray-100 p-6 space-y-6">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading matrices...</div>
        ) : responses?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <p>No matrices submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {responses?.map((r) => {
              const cells: Record<string, string> = responseDataOf(r.responseData, "matrix")?.cells ?? {};
              return (
                <div key={r.id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
                  <div className="font-semibold text-sm mb-4 text-brand-600">
                    {r.user?.name ?? "Anonymous Participant"}
                  </div>
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
                      {rows.map((rowLabel) => (
                        <tr key={rowLabel}>
                          <td className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700">
                            {rowLabel}
                          </td>
                          {cols.map((colLabel) => (
                            <td key={colLabel} className="border-b border-l border-gray-100 px-4 py-2 text-sm text-gray-800">
                              {cells[`${rowLabel}__${colLabel}`] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
