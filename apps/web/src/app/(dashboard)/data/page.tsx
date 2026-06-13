"use client";

import React, { useState } from "react";
import { useWorkspaceResponses } from "@/hooks/useWorkspaceResponses";
import { format } from "date-fns";
import { Search, Loader2, ChevronLeft, Calendar, Users, ChevronDown, ChevronRight, Download } from "lucide-react";
import * as XLSX from "xlsx";

// ── Response data helpers ─────────────────────────────────────────────
// Turn an arbitrary value into one readable cell string (no raw JSON).
function toCellString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.map(toCellString).filter(Boolean).join(", ");
  if (typeof v === "object") {
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `${humanizeKey(k)}: ${toCellString(val)}`)
      .join("; ");
  }
  return String(v);
}

// Flatten a response's data into a flat label→value record for table columns.
function flattenResponse(rd: unknown): Record<string, string> {
  if (rd && typeof rd === "object" && !Array.isArray(rd)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(rd as Record<string, unknown>)) out[k] = toCellString(v);
    return out;
  }
  return { Response: toCellString(rd) };
}

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function DataPage() {
  const { data: responses, isLoading, isError } = useWorkspaceResponses();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTrainingId, setActiveTrainingId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => ({ ...prev, [dayId]: !prev[dayId] }));
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500">
        <p>Failed to load responses data.</p>
      </div>
    );
  }

  const filteredResponses = responses?.filter((res) => {
    const term = searchTerm.toLowerCase();
    return (
      res.user?.name?.toLowerCase().includes(term) ||
      res.user?.email?.toLowerCase().includes(term) ||
      res.training?.title?.toLowerCase().includes(term) ||
      res.module?.title?.toLowerCase().includes(term)
    );
  }) ?? [];

  const groupedByTraining = filteredResponses.reduce((acc, response) => {
    const trainingId = response.trainingId || "unknown";
    if (!acc[trainingId]) {
      acc[trainingId] = {
        training: response.training,
        responses: [],
      };
    }
    acc[trainingId].responses.push(response);
    return acc;
  }, {} as Record<string, { training: (typeof filteredResponses)[number]["training"]; responses: typeof filteredResponses }>);

  // If a training is selected, show details
  if (activeTrainingId && groupedByTraining[activeTrainingId]) {
    const activeGroup = groupedByTraining[activeTrainingId];

    // Group responses by day → module
    const groupedByDayModule = activeGroup.responses.reduce((acc, response) => {
      const dayId = response.module?.day?.id || "no-day";
      const dayTitle = response.module?.day?.title || "Unassigned";
      const dayNumber = response.module?.day?.dayNumber || 0;
      const moduleId = response.module?.id || "unknown";
      const moduleTitle = response.module?.title || "Unknown Module";

      if (!acc[dayId]) {
        acc[dayId] = { dayNumber, dayTitle, modules: {} };
      }
      if (!acc[dayId].modules[moduleId]) {
        acc[dayId].modules[moduleId] = { moduleTitle, responses: [] };
      }
      acc[dayId].modules[moduleId].responses.push(response);
      return acc;
    }, {} as Record<string, { dayNumber: number; dayTitle: string; modules: Record<string, { moduleTitle: string; responses: typeof filteredResponses }> }>);

    // Sort days by dayNumber
    const sortedDays = Object.entries(groupedByDayModule).sort(
      ([, a], [, b]) => (a.dayNumber || 0) - (b.dayNumber || 0)
    );

    const exportExcel = () => {
      const rows = activeGroup.responses;
      const flat = rows.map((r) => flattenResponse(r.responseData));
      const dataKeys = Array.from(new Set(flat.flatMap((f) => Object.keys(f))));
      const header = ["Participant", "Email", "Day", "Module", "Date", "Time", ...dataKeys.map(humanizeKey)];
      const body = rows.map((r, i) => [
        r.user?.name ?? "",
        r.user?.email ?? "",
        r.module?.day?.title ?? "Unassigned",
        r.module?.title ?? "",
        format(new Date(r.submittedAt), "yyyy-MM-dd"),
        format(new Date(r.submittedAt), "h:mm a"),
        ...dataKeys.map((k) => flat[i][k] ?? ""),
      ]);
      const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
      ws["!cols"] = header.map((_, c) =>
        ({ wch: Math.min(50, Math.max(12, ...[header, ...body].map((row) => String(row[c] ?? "").length + 2))) }),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Responses");
      XLSX.writeFile(wb, `${(activeGroup.training?.title || "training").replace(/[^\w-]+/g, "_")}-responses.xlsx`);
    };

    return (
      <div className="flex flex-col h-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-1 w-full">
            <button
              onClick={() => setActiveTrainingId(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                {activeGroup.training?.title || "Unknown Training"}
              </h1>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {activeGroup.responses.length} Total Responses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={exportExcel}
              disabled={activeGroup.responses.length === 0}
              className="w-full sm:w-auto justify-center px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto space-y-4 pb-6 pr-2">
          {sortedDays.map(([dayId, dayData]) => {
            const isExpanded = expandedDays[dayId];
            const totalResponses = Object.values(dayData.modules).reduce((sum, m) => sum + m.responses.length, 0);

            return (
              <div key={dayId} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                <button
                  onClick={() => toggleDay(dayId)}
                  className="px-6 py-4 border-b border-gray-100 bg-brand-50/50 flex items-center justify-between hover:bg-brand-50 transition-colors w-full text-left"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brand-600" />
                    <h3 className="text-lg font-semibold text-gray-900">{dayData.dayTitle}</h3>
                    <span className="inline-flex items-center justify-center bg-brand-100 text-brand-700 px-2.5 py-0.5 rounded-full text-xs font-medium ml-2">
                      {totalResponses} {totalResponses === 1 ? "Response" : "Responses"}
                    </span>
                  </div>
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                </button>

                {isExpanded && (
                  <div className="p-4 space-y-4 border-t border-gray-100 bg-gray-50/30">
                    {Object.entries(dayData.modules).map(([moduleId, moduleData]) => {
                      const isModuleExpanded = expandedModules[moduleId];
                      return (
                        <div key={moduleId} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                          <button
                            onClick={() => toggleModule(moduleId)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <h4 className="font-medium text-gray-900">{moduleData.moduleTitle}</h4>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {moduleData.responses.length}
                              </span>
                            </div>
                            {isModuleExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                          </button>

                          {isModuleExpanded && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                  <tr>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Participant</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Response Data</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {moduleData.responses.map((response) => (
                                    <tr key={response.id} className="hover:bg-gray-50/50">
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                          <div className="h-6 w-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs flex-shrink-0">
                                            {response.user?.name?.[0]?.toUpperCase()}
                                          </div>
                                          <div className="min-w-0">
                                            <p className="text-xs font-medium text-gray-900">{response.user?.name}</p>
                                            <p className="text-xs text-gray-400">{response.user?.email}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                        {format(new Date(response.submittedAt), "h:mm a")}
                                      </td>
                                      <td className="px-4 py-3 text-xs text-gray-700">
                                        {(() => {
                                          const flat = flattenResponse(response.responseData);
                                          const entries = Object.entries(flat).filter(([, v]) => v !== "");
                                          if (entries.length === 0)
                                            return <span className="text-gray-400 italic text-xs">No data</span>;
                                          return (
                                            <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 max-h-20 overflow-y-auto">
                                              {entries.map(([k, v]) => (
                                                <React.Fragment key={k}>
                                                  <dt className="text-xs font-medium text-gray-500 whitespace-nowrap">{humanizeKey(k)}:</dt>
                                                  <dd className="text-xs text-gray-800 break-words">{v}</dd>
                                                </React.Fragment>
                                              ))}
                                            </dl>
                                          );
                                        })()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Data & Responses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and view all participant responses across your trainings.
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by participant, training..."
            className="pl-9 pr-4 py-2 border border-gray-100 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-6 pb-6 pr-2">
        {Object.values(groupedByTraining).length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center text-sm text-gray-500">
            No responses found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(groupedByTraining).map((group) => (
              <div 
                key={group.training?.id || "unknown"} 
                className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setActiveTrainingId(group.training?.id || "unknown")}
              >
                <div className="p-6 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {group.training?.title || "Unknown Training"}
                  </h2>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{group.responses.length} {group.responses.length === 1 ? 'Response' : 'Responses'}</span>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-brand-600 font-medium hover:text-brand-700">View Data →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
