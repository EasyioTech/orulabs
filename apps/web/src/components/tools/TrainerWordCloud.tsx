"use client";

import { useMemo, useRef, useState } from "react";
import { useModuleResponses } from "@/hooks/useModuleResponses";
import { responseDataOf, type TrainingModule } from "@oruclass/types";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerWordCloud({ module, trainingId }: Props) {
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);
  const cloudRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const wordFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    responses?.forEach((r) => {
      const words = responseDataOf(r.responseData, "wordcloud")?.words ?? [];
      words.forEach((w) => {
        const key = w.toLowerCase().trim();
        if (key) freq[key] = (freq[key] ?? 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60);
  }, [responses]);

  const maxFreq = Math.max(1, wordFreq[0]?.[1] ?? 1);

  const exportAsImage = async () => {
    if (!cloudRef.current || isExporting) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(cloudRef.current, {
        backgroundColor: "#f9fafb", // Match gray-50
        scale: 2,
      });
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `word-cloud-${module.id}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{module.title} (Trainer View)</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 font-medium">{responses?.length ?? 0} Responses</div>
          <button
            onClick={exportAsImage}
            disabled={isExporting || wordFreq.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-md hover:bg-brand-100 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <Download size={16} />
            {isExporting ? "Exporting..." : "Export Image"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Analytics Sidebar */}
        <div className="w-64 bg-white border border-gray-100 rounded-xl flex flex-col hidden md:flex">
          <div className="p-4 border-b border-gray-100 font-semibold text-gray-800">
            Top Words
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {wordFreq.length === 0 ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              wordFreq.slice(0, 20).map(([word, count], i) => (
                <div key={word} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 w-4 text-xs">{i + 1}.</span>
                    <span className="text-gray-700 font-medium truncate max-w-[120px]">{word}</span>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Word Cloud Canvas */}
        <div 
          ref={cloudRef}
          className="flex-1 overflow-auto bg-gray-50 rounded-xl border border-gray-100 p-8 flex items-center justify-center relative min-h-[300px]"
        >
          {isLoading ? (
            <div className="text-gray-400">Loading words...</div>
          ) : wordFreq.length === 0 ? (
            <div className="text-gray-400">No words submitted yet.</div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl">
              {wordFreq.map(([word, count]) => {
                const scale = 1 + (count / maxFreq) * 2; // Increased scale variance
                const opacity = 0.5 + (count / maxFreq) * 0.5;
                return (
                  <span
                    key={word}
                    className="text-brand-700 font-bold transition-all cursor-default hover:text-brand-500 hover:scale-110"
                    style={{ fontSize: `${scale}rem`, opacity }}
                    title={`${word}: ${count}`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
