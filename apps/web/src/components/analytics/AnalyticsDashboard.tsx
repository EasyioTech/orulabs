"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import { useDays } from "@/hooks/useDays";
import { cn } from "@oruclass/utils";
import { ChevronDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface ModuleStat {
  moduleId: string;
  title: string;
  moduleType: string;
  responseCount: number;
  participantCount: number;
  completionRate: number;
  dayId?: string | null;
}

interface AnalyticsData {
  trainingId: string;
  totalParticipants: number;
  modules: ModuleStat[];
  generatedAt: string;
}

export function AnalyticsDashboard({ trainingId }: { trainingId: string }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const qc = useQueryClient();

  const [exportJobId, setExportJobId] = React.useState<string | null>(null);
  const [startDayIdx, setStartDayIdx] = React.useState<number>(0);
  const [endDayIdx, setEndDayIdx] = React.useState<number>(0);

  const { data: days } = useDays(workspaceId, trainingId);

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics", trainingId],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/analytics`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    enabled: !!(workspaceId && trainingId),
  });

  const exportExcel = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<{ jobId: string; status: string }>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/analytics/export`,
        {},
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    onSuccess: (data) => {
      setExportJobId(data.jobId);
    }
  });

  const { data: jobStatus } = useQuery({
    queryKey: ["analytics-export-job", exportJobId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ jobId: string; status: string; excelUrl: string | null }>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/analytics/export/${exportJobId}`,
        { headers: { "X-Workspace-ID": workspaceId } }
      );
      return data;
    },
    enabled: !!exportJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 1500;
    }
  });

  React.useEffect(() => {
    if (jobStatus?.status === "completed" && jobStatus.excelUrl) {
      window.open(jobStatus.excelUrl, "_blank");
      setExportJobId(null);
    }
  }, [jobStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allModules = analytics?.modules ?? [];
  const selectedDayIds = new Set(
    (days ?? []).slice(startDayIdx, endDayIdx + 1).map((d) => d.id)
  );

  const modules =
    days && days.length > 0
      ? allModules.filter((m) => m.dayId && selectedDayIds.has(m.dayId))
      : allModules;

  const avgCompletion =
    modules.length > 0
      ? Math.round(modules.reduce((sum, m) => sum + m.completionRate, 0) / modules.length)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Training Analytics</h1>
        <div className="flex items-center gap-3">
          {exportJobId && jobStatus?.status !== "completed" && (
            <span className="text-xs text-brand-600 animate-pulse">Generating Excel...</span>
          )}
          <button
            onClick={() => exportExcel.mutate()}
            disabled={exportExcel.isPending || !!exportJobId}
            className="px-5 py-2 bg-white text-[#1a73e8] border border-[#dadce0] rounded-md hover:bg-[#e8f0fe] hover:border-[#1a73e8] disabled:opacity-60 transition-colors text-sm font-medium shadow-sm"
          >
            {exportExcel.isPending || !!exportJobId ? "Exporting…" : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Day Selectors */}
      {days && days.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-[#dadce0] shadow-sm">
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">From Day</label>
            <div className="relative">
              <select
                value={startDayIdx}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStartDayIdx(val);
                  if (val > endDayIdx) setEndDayIdx(val);
                }}
                className="appearance-none bg-[#f8f9fa] text-gray-700 font-medium py-2 pl-4 pr-10 rounded-lg outline-none focus:bg-[#e8eaed] transition-colors cursor-pointer border-b-2 border-transparent focus:border-[#1a73e8] min-w-[140px]"
              >
                {days.map((day, idx) => (
                  <option key={day.id} value={idx}>
                    Day {idx + 1}: {day.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">To Day</label>
            <div className="relative">
              <select
                value={endDayIdx}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEndDayIdx(val);
                  if (val < startDayIdx) setStartDayIdx(val);
                }}
                className="appearance-none bg-[#f8f9fa] text-gray-700 font-medium py-2 pl-4 pr-10 rounded-lg outline-none focus:bg-[#e8eaed] transition-colors cursor-pointer border-b-2 border-transparent focus:border-[#1a73e8] min-w-[140px]"
              >
                {days.map((day, idx) => (
                  <option key={day.id} value={idx}>
                    Day {idx + 1}: {day.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#dadce0] p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Participants</p>
          <p className="text-3xl font-bold text-[#1a73e8] mt-1">{analytics?.totalParticipants ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#dadce0] p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Modules</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{modules.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#dadce0] p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Completion</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{avgCompletion}%</p>
        </div>
      </div>

      {/* Per-module completion bar chart */}
      {modules.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#dadce0] p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Completion by Module</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={modules} margin={{ top: 4, right: 8, bottom: 32, left: 0 }}>
              <XAxis
                dataKey="title"
                tick={{ fontSize: 11 }}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="completionRate" radius={[4, 4, 0, 0]}>
                {modules.map((_: ModuleStat, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Module breakdown table */}
      {modules.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#dadce0] overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-[#dadce0] bg-gray-50">
            <h3 className="font-bold text-gray-900">Module Breakdown</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responses
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion
                </th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m: ModuleStat, i: number) => (
                <tr key={m.moduleId} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                  <td className="px-5 py-3 font-medium text-gray-900">{m.title}</td>
                  <td className="px-5 py-3 text-gray-500 capitalize">{m.moduleType}</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {m.responseCount} / {m.participantCount}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.completionRate >= 75
                          ? "bg-green-100 text-green-700"
                          : m.completionRate >= 40
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {m.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!analytics && (
        <div className="bg-white rounded-2xl border border-dashed border-[#dadce0] p-16 text-center shadow-sm">
          <p className="text-gray-500 font-medium">No analytics data yet. Run a live session first.</p>
        </div>
      )}
    </div>
  );
}
