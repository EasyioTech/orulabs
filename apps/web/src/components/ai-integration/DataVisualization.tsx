"use client";

import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { Share2, Download, Table2, Presentation, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@oruclass/utils";
import type { AnalyzedData } from "./types";

type ChartView = "bar" | "line" | "area" | "table";

export function DataVisualization({ data }: { data: AnalyzedData | null }) {
  const [activeView, setActiveView] = useState<ChartView>("area");

  if (!data) return null;

  return (
    <div className="bg-white rounded border border-gray-300 p-6 shadow-sm font-sans animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-lg font-normal text-gray-800 tracking-tight">Insight Synthesis</h3>
          <p className="text-sm text-gray-600 mt-0.5">{data.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Export as PDF">
            <Download size={18} />
          </button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Share with Team">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {data.metrics?.map((metric, i) => (
          <div key={i} className="p-4 bg-white rounded border border-gray-300 shadow-sm">
            <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{metric.label}</div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-2xl font-normal text-gray-900 tracking-tight">{metric.value}</span>
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded",
                metric.change.startsWith('+') ? "bg-[#e6f4ea] text-[#137333]" : "bg-[#fce8e6] text-[#c5221f]"
              )}>
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="border border-gray-300 rounded bg-white shadow-sm">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h4 className="text-sm font-medium text-gray-700">Temporal Performance</h4>
          <div className="flex bg-gray-100 rounded border border-gray-200 p-0.5">
            {([
              { id: "area", icon: Presentation, label: "Area" },
              { id: "bar", icon: BarChart, label: "Bar" },
              { id: "table", icon: Table2, label: "Table" },
            ] as { id: ChartView; icon: LucideIcon; label: string }[]).map((view) => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    activeView === view.id 
                      ? "bg-white text-[#1a73e8] shadow-sm border border-gray-200" 
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent"
                  )}
                  title={view.label}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="p-6">
          {activeView !== "table" ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeView === "area" ? (
                  <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e8e3e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#1e8e3e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5f6368' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5f6368' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #dadce0', color: '#202124', boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)' }}
                      cursor={{ stroke: '#dadce0', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#5f6368' }} />
                    <Area type="monotone" dataKey="sales" stroke="#1a73e8" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" name="Sales / Revenue" />
                    <Area type="monotone" dataKey="visits" stroke="#1e8e3e" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" name="Active Users" />
                  </AreaChart>
                ) : (
                  <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5f6368' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5f6368' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #dadce0', color: '#202124', boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)' }}
                      cursor={{ fill: '#f8f9fa' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px', color: '#5f6368' }} />
                    <Bar dataKey="sales" fill="#1a73e8" radius={[2, 2, 0, 0]} maxBarSize={40} name="Sales / Revenue" />
                    <Bar dataKey="visits" fill="#1e8e3e" radius={[2, 2, 0, 0]} maxBarSize={40} name="Active Users" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-gray-300">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium tracking-wide">Period</th>
                    <th className="px-4 py-3 font-medium tracking-wide text-right">Sales</th>
                    <th className="px-4 py-3 font-medium tracking-wide text-right">Visits</th>
                    <th className="px-4 py-3 font-medium tracking-wide text-right">Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chartData.map((row, i) => (
                    <tr key={i} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{row.sales.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{row.visits.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{row.returns.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
