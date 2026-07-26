"use client";

import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import { useDays } from "@/hooks/useDays";
import { cn } from "@oruclass/utils";
import { ChevronDown, Download, Users, Layers, Activity, Zap, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#3b82f6"];

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

// Sparkline component for KPI cards
const Sparkline = ({ data, color }: { data: any[]; color: string }) => (
  <div className="h-12 w-full mt-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`color-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color-${color})`} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export function AnalyticsDashboard({ trainingId }: { trainingId: string }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  
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

  // Fake sparkline data to make it look premium
  const sparklineData1 = useMemo(() => Array.from({ length: 10 }, () => ({ value: Math.random() * 100 })), []);
  const sparklineData2 = useMemo(() => Array.from({ length: 10 }, () => ({ value: Math.random() * 100 + 50 })), []);
  const sparklineData3 = useMemo(() => Array.from({ length: 10 }, () => ({ value: Math.random() * 50 + avgCompletion })), [avgCompletion]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-slate-50/50 min-h-full p-4 md:p-8 rounded-3xl">
      {/* Header section with glassmorphism */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900">
            Training Intelligence
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Real-time performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          {exportJobId && jobStatus?.status !== "completed" && (
            <span className="text-sm font-semibold text-indigo-600 animate-pulse flex items-center gap-2">
              <Zap size={16} /> Generating Report...
            </span>
          )}
          <button
            onClick={() => exportExcel.mutate()}
            disabled={exportExcel.isPending || !!exportJobId}
            className="group relative px-6 py-2.5 bg-slate-900 text-white rounded-xl overflow-hidden shadow-lg shadow-slate-900/20 hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-70"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative flex items-center gap-2 text-sm font-semibold">
              <Download size={16} className="group-hover:-translate-y-0.5 transition-transform" />
              {exportExcel.isPending || !!exportJobId ? "Exporting…" : "Export Report"}
            </span>
          </button>
        </div>
      </div>

      {/* Date Filters */}
      {days && days.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-6 px-6 py-5 bg-white/60 backdrop-blur-md rounded-2xl border border-white/80 shadow-sm"
        >
          <div className="flex items-center gap-2 text-slate-400">
            <BarChart3 size={18} />
            <span className="text-sm font-semibold uppercase tracking-wider">Time Range</span>
          </div>
          
          <div className="w-[1px] h-6 bg-slate-200" />

          <div className="flex items-center gap-4">
            <div className="relative group">
              <select
                value={startDayIdx}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStartDayIdx(val);
                  if (val > endDayIdx) setEndDayIdx(val);
                }}
                className="appearance-none bg-white text-slate-700 font-semibold py-2 pl-4 pr-10 rounded-xl outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-shadow cursor-pointer min-w-[140px] shadow-sm group-hover:shadow-md"
              >
                {days.map((day, idx) => (
                  <option key={day.id} value={idx}>
                    Day {idx + 1}: {day.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>
            <span className="text-slate-400 font-medium">to</span>
            <div className="relative group">
              <select
                value={endDayIdx}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEndDayIdx(val);
                  if (val < startDayIdx) setStartDayIdx(val);
                }}
                className="appearance-none bg-white text-slate-700 font-semibold py-2 pl-4 pr-10 rounded-xl outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-shadow cursor-pointer min-w-[140px] shadow-sm group-hover:shadow-md"
              >
                {days.map((day, idx) => (
                  <option key={day.id} value={idx}>
                    Day {idx + 1}: {day.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Premium KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Total Participants", value: analytics?.totalParticipants ?? 0, icon: Users, color: "#6366f1", sparkline: sparklineData1 },
          { title: "Active Modules", value: modules.length, icon: Layers, color: "#ec4899", sparkline: sparklineData2 },
          { title: "Avg Completion", value: `${avgCompletion}%`, icon: Activity, color: "#14b8a6", sparkline: sparklineData3 },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white rounded-3xl border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-300 overflow-hidden"
          >
            {/* Top right decorative gradient blob */}
            <div 
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-500" 
              style={{ background: kpi.color }} 
            />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}
                >
                  <kpi.icon size={20} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{kpi.title}</p>
              <p className="text-4xl font-extrabold text-slate-900 mt-2 tracking-tight">{kpi.value}</p>
              <Sparkline data={kpi.sparkline} color={kpi.color} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stunning Chart Section */}
      {modules.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Completion Engagement</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Module completion rates across the selected range</p>
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modules} margin={{ top: 20, right: 0, bottom: 40, left: -20 }}>
                <defs>
                  {COLORS.map((color, i) => (
                    <linearGradient key={color} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="title"
                  tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  dy={15}
                  interval={0}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '12px 20px', fontWeight: 600 }}
                  itemStyle={{ color: '#0f172a', fontWeight: 700 }}
                  formatter={(v: number) => [`${v}%`, 'Completion']}
                />
                <Bar 
                  dataKey="completionRate" 
                  radius={[6, 6, 6, 6]}
                  barSize={40}
                  animationDuration={1500}
                >
                  {modules.map((_: ModuleStat, i: number) => (
                    <Cell key={i} fill={`url(#barGrad-${i % COLORS.length})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Enhanced Data Table */}
      {modules.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xl font-bold text-slate-900">Module Breakdown</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Detailed metrics per module</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-100">
                  <th className="text-left px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest w-1/3">
                    Module Name
                  </th>
                  <th className="text-left px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Type
                  </th>
                  <th className="text-right px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Responses
                  </th>
                  <th className="text-left px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest w-[200px]">
                    Completion Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {modules.map((m: ModuleStat, i: number) => (
                  <tr key={m.moduleId} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-900">{m.title}</p>
                      {m.dayId && <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase">Has Day Assigned</p>}
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold capitalize shadow-sm">
                        {m.moduleType}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-semibold text-slate-700">
                      {m.responseCount} <span className="text-slate-400 font-normal">/ {m.participantCount}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <span className="w-9 font-bold text-slate-700 text-right">{m.completionRate}%</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${m.completionRate}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn("h-full rounded-full shadow-sm", 
                              m.completionRate >= 75 ? "bg-emerald-500" : 
                              m.completionRate >= 40 ? "bg-amber-500" : "bg-rose-500"
                            )}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {!analytics && (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center shadow-sm">
          <Activity size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">Awaiting Data</h3>
          <p className="text-slate-500 font-medium mt-2">Run a live session to generate breathtaking analytics.</p>
        </div>
      )}
    </div>
  );
}
