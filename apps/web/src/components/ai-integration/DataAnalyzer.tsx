"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, Play, Activity } from "lucide-react";
import { cn } from "@oruclass/utils";

export function DataAnalyzer({ onAnalysisComplete }: { onAnalysisComplete: (data: any) => void }) {
  const [dataInput, setDataInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!dataInput.trim()) return;
    
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const mockResult = {
        summary: "Analysis complete. Identified positive growth vectors across core operational metrics in the last 7 periods.",
        metrics: [
          { label: "Total Volume", value: "24,592", change: "+12%" },
          { label: "Active Users", value: "1,204", change: "+5%" },
          { label: "Conversion Rate", value: "4.3%", change: "-1.2%" }
        ],
        chartData: [
          { name: "Jan", sales: 4000, visits: 2400, returns: 400 },
          { name: "Feb", sales: 3000, visits: 1398, returns: 300 },
          { name: "Mar", sales: 2000, visits: 9800, returns: 200 },
          { name: "Apr", sales: 2780, visits: 3908, returns: 278 },
          { name: "May", sales: 1890, visits: 4800, returns: 189 },
          { name: "Jun", sales: 2390, visits: 3800, returns: 239 },
          { name: "Jul", sales: 3490, visits: 4300, returns: 349 },
        ]
      };
      
      setIsAnalyzing(false);
      onAnalysisComplete(mockResult);
    }, 2500);
  };

  return (
    <div className="rounded border border-gray-300 bg-white shadow-sm p-6 font-sans">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded bg-gray-100 border border-gray-200 text-gray-700">
          <Activity size={18} />
        </div>
        <div>
          <h3 className="text-lg font-normal text-gray-800 tracking-tight">Data Ingestion</h3>
          <p className="text-sm text-gray-600 mt-0.5">
            Provide raw structured data (JSON, CSV) for the engine to analyze and visualize.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <textarea
            rows={6}
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            placeholder='e.g., {"revenue": 5000, "expenses": 3000} or paste CSV rows...'
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] resize-y transition-colors"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div className="flex gap-3 w-full sm:w-auto">
            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors">
              <Upload size={16} />
              Upload file
            </button>
            <button 
              onClick={() => setDataInput('{"example": "data", "status": "ready"}')}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded transition-colors"
            >
              <FileText size={16} />
              Sample data
            </button>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !dataInput.trim()}
            className={cn(
              "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 rounded text-sm font-medium transition-colors",
              isAnalyzing
                ? "bg-blue-50 text-[#1a73e8] cursor-wait"
                : "bg-[#1a73e8] text-white hover:bg-[#1557b0] disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-500"
            )}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play size={16} className="fill-current" />
                Analyze
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
