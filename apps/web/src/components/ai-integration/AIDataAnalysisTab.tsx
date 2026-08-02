"use client";

import { useState } from "react";
import { AIModelSettings } from "./AIModelSettings";
import { DataAnalyzer } from "./DataAnalyzer";
import { DataVisualization } from "./DataVisualization";
import { WorkspaceAgent } from "./WorkspaceAgent";
import { BarChart3, Settings2, Cpu } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { AnalyzedData } from "./types";

export function AIDataAnalysisTab({ workspaceId }: { workspaceId: string }) {
  const [activeSection, setActiveSection] = useState<"model" | "analysis" | "agent">("agent");
  const [analyzedData, setAnalyzedData] = useState<AnalyzedData | null>(null);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h2 className="text-xl font-normal text-gray-800 tracking-tight">
            AI & Data Analysis
          </h2>
          <p className="text-sm text-gray-600 mt-1">Configure models, analyze data, and manage the workspace agent.</p>
        </div>
        
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={() => setActiveSection("agent")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-[14px] font-medium transition-colors rounded-full",
              activeSection === "agent" 
                ? "bg-[#e8f0fe] text-[#1a73e8]" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <Cpu size={16} className={activeSection === "agent" ? "text-[#1a73e8]" : "text-gray-500"} />
            Agent
          </button>
          <button
            onClick={() => setActiveSection("analysis")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-[14px] font-medium transition-colors rounded-full",
              activeSection === "analysis" 
                ? "bg-[#e8f0fe] text-[#1a73e8]" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <BarChart3 size={16} className={activeSection === "analysis" ? "text-[#1a73e8]" : "text-gray-500"} />
            Analytics
          </button>
          <button
            onClick={() => setActiveSection("model")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-[14px] font-medium transition-colors rounded-full",
              activeSection === "model" 
                ? "bg-[#e8f0fe] text-[#1a73e8]" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <Settings2 size={16} className={activeSection === "model" ? "text-[#1a73e8]" : "text-gray-500"} />
            Engine Setup
          </button>
        </div>
      </div>

      <div className="pt-6">
        {activeSection === "agent" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <WorkspaceAgent workspaceId={workspaceId} />
          </div>
        )}
        
        {activeSection === "model" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-8">
            <AIModelSettings />
          </div>
        )}
        
        {activeSection === "analysis" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-8">
            <DataAnalyzer onAnalysisComplete={setAnalyzedData} />
            {analyzedData && <DataVisualization data={analyzedData} />}
          </div>
        )}
      </div>
    </div>
  );
}
