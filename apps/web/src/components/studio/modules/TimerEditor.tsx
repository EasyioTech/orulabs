import React, { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, X, ToggleLeft, ToggleRight, LayoutTemplate, ListChecks, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { TrainingModule, ModuleConfig, FormField, FormFieldType } from "@oruclass/types";

export function TimerEditor({ module, config, onChange }: { module: TrainingModule; config: any; onChange: (c: any) => void }) {
  const mins = Math.floor((config.durationSeconds ?? 300) / 60);
    const secs = (config.durationSeconds ?? 300) % 60;
    return (
      <div className="space-y-3 mt-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Timer label</label>
          <input
            value={config.timerLabel ?? ""}
            onChange={(e) => onChange({ ...config, timerLabel: e.target.value })}
            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="Time remaining"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-600 shrink-0">Duration</label>
          <input
            type="number"
            min={0}
            max={120}
            value={mins}
            onChange={(e) => onChange({ ...config, durationSeconds: Number(e.target.value) * 60 + secs })}
            className="w-16 px-3 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
          />
          <span className="text-xs text-gray-500">min</span>
          <input
            type="number"
            min={0}
            max={59}
            value={secs}
            onChange={(e) => onChange({ ...config, durationSeconds: mins * 60 + Number(e.target.value) })}
            className="w-16 px-3 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
          />
          <span className="text-xs text-gray-500">sec</span>
        </div>
      </div>
    );
}
