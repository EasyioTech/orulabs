"use client";

import { useState } from "react";
import { AIModelSettings } from "./AIModelSettings";
import { DataAnalyzer } from "./DataAnalyzer";
import { DataVisualization } from "./DataVisualization";
import { WorkspaceAgent } from "./WorkspaceAgent";
import { BarChart3, Settings2, Cpu } from "lucide-react";
import { cn } from "@oruclass/utils";

export function AIDataAnalysisTab({ workspaceId }: { workspaceId: string }) {
  const [activeSection, setActiveSection] = useState<"model" | "analysis" | "agent">("agent");
  const [analyzedData, setAnalyzedData] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-6 gap-4">
        <div>
          <h2 className="text-xl font-normal text-gray-800 tracking-tight">
            AI & Data Analysis
          </h2>
          <p className="text-sm text-gray-600 mt-1">Configure models, analyze data, and manage the workspace agent.</p>
        </div>
        
        <div className="flex bg-gray-50/80 p-1 rounded-md border border-gray-200">
          <button
            onClick={() => setActiveSection("agent")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2",
              activeSection === "agent" 
                ? "bg-white text-[#1a73e8] shadow-sm border-gray-200/50" 
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            )}
          >
            <Cpu size={16} />
            Agent
          </button>
          <button
            onClick={() => setActiveSection("analysis")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2",
              activeSection === "analysis" 
                ? "bg-white text-[#1a73e8] shadow-sm border-gray-200/50" 
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            )}
          >
            <BarChart3 size={16} />
            Analytics
          </button>
          <button
            onClick={() => setActiveSection("model")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded transition-colors flex items-center gap-2",
              activeSection === "model" 
                ? "bg-white text-[#1a73e8] shadow-sm border-gray-200/50" 
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            )}
          >
            <Settings2 size={16} />
            Engine Setup
          </button>
        </div>
      </div>

      <div className="relative">
        {activeSection === "agent" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <WorkspaceAgent workspaceId={workspaceId} />
          </div>
        )}
        
        {activeSection === "model" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AIModelSettings />
          </div>
        )}
        
        {activeSection === "analysis" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <DataAnalyzer onAnalysisComplete={setAnalyzedData} />
            {analyzedData && <DataVisualization data={analyzedData} />}
          </div>
        )}
      </div>
    </div>
  );
}
