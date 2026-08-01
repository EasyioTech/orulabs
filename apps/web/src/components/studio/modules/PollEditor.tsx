import React, { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, X, ToggleLeft, ToggleRight, LayoutTemplate, ListChecks, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { TrainingModule, ModuleConfig, FormField, FormFieldType } from "@oruclass/types";

export function PollEditor({ module, config, onChange }: { module: TrainingModule; config: any; onChange: (c: any) => void }) {
  const options = (config.pollOptions as string[]) ?? [];
    return (
      <div className="space-y-3 mt-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Poll question</label>
          <input
            value={config.pollQuestion ?? ""}
            onChange={(e) => onChange({ ...config, pollQuestion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent"
            placeholder="What do you want to ask?"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Allow multiple selections</label>
          <button
            onClick={() => onChange({ ...config, allowMultiple: !config.allowMultiple })}
            className={cn("flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors",
              config.allowMultiple ? "bg-[#e8f0fe] border-[#d2e3fc] text-[#1557b0]" : "bg-white border-gray-100 text-gray-400")}
          >
            {config.allowMultiple ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
            {config.allowMultiple ? "On" : "Off"}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Options</p>
          <button
            onClick={() => onChange({ ...config, pollOptions: [...options, ""] })}
            className="flex items-center gap-1 text-sm text-[#1a73e8] hover:text-[#1557b0] font-medium"
          >
            <Plus size={12} /> Add option
          </button>
        </div>
        {options.length === 0 && (
          <div className="py-5 text-center bg-gray-50 rounded border border-dashed border-gray-100">
            <p className="text-xs text-gray-400">No options yet. Add options above.</p>
          </div>
        )}
        {options.map((opt, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              value={opt}
              onChange={(e) => {
                const updated = options.map((o: any, j: number) => (j === i ? e.target.value : o));
                onChange({ ...config, pollOptions: updated });
              }}
              className="flex-1 px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
              placeholder={`Option ${i + 1}`}
            />
            <button
              onClick={() => onChange({ ...config, pollOptions: options.filter((_: any, j: number) => j !== i) })}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    );
}
