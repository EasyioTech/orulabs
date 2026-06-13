"use client";

import { useModuleResponses } from "@/hooks/useModuleResponses";
import { responseDataOf, type TrainingModule, type AttendanceField } from "@oruclass/types";
import { ClipboardList, Users, Clock } from "lucide-react";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerAttendance({ module, trainingId }: Props) {
  const fields: AttendanceField[] = (module.config.attendanceFields as AttendanceField[]) ?? [];

  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);

  const count = responses?.length ?? 0;

  return (
    <div className="flex h-full flex-col p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
            <ClipboardList size={18} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-gray-900">{module.title}</h2>
            <p className="text-[11px] text-gray-400">Live attendance</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 rounded-full px-3 py-1.5">
          <Users size={13} className="text-brand-500" />
          <span className="text-[13px] font-bold text-brand-700">{count}</span>
          <span className="text-[11px] text-brand-500">attended</span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Loading attendance…
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 p-8">
            <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
              <ClipboardList size={22} className="text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">No attendance yet</p>
              <p className="text-[12px] text-gray-400 mt-0.5">Participants are filling in the form</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
              <tr>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 w-8">#</th>
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Name</th>
                {fields.map((f) => (
                  <th key={f.id} className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    {f.label}
                  </th>
                ))}
                <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  <Clock size={11} className="inline mr-1" />
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {responses?.map((r, i) => {
                const data: Record<string, string> = responseDataOf(r.responseData, "attendance")?.fields ?? {};
                return (
                  <tr key={r.id ?? i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-[12px] font-medium">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[11px] font-bold text-brand-700 flex-shrink-0">
                          {(data.name ?? r.user?.name ?? "?").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 text-[13px]">
                          {data.name ?? r.user?.name ?? "—"}
                        </span>
                      </div>
                    </td>
                    {fields.map((f) => (
                      <td key={f.id} className="px-4 py-3 text-gray-600 text-[13px]">
                        {data[f.id] || <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-gray-400 text-[11px] font-medium whitespace-nowrap">
                      {new Date(r.submittedAt ?? r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
