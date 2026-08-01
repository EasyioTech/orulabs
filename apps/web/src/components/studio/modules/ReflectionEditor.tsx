import React, { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, X, ToggleLeft, ToggleRight, LayoutTemplate, ListChecks, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { TrainingModule, ModuleConfig, FormField, FormFieldType } from "@oruclass/types";

export function ReflectionEditor({ module, config, onChange }: { module: TrainingModule; config: any; onChange: (c: any) => void }) {
  return (
      <div className="space-y-3 mt-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Reflection prompt</label>
          <textarea
            value={config.prompt ?? ""}
            onChange={(e) => onChange({ ...config, prompt: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors resize-none"
            placeholder="What would you like participants to reflect on?"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-600 shrink-0">Max characters</label>
          <input
            type="number"
            min={50}
            max={5000}
            value={config.maxLength ?? 500}
            onChange={(e) => onChange({ ...config, maxLength: Number(e.target.value) })}
            className="w-28 px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
          />
        </div>
      </div>
    );
}
