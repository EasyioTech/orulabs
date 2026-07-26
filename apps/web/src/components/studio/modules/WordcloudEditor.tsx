import React, { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, X, ToggleLeft, ToggleRight, LayoutTemplate, ListChecks, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { TrainingModule, ModuleConfig, FormField, FormFieldType } from "@oruclass/types";

export function WordcloudEditor({ module, config, onChange }: { module: TrainingModule; config: any; onChange: (c: any) => void }) {
  return (
      <div className="space-y-3 mt-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Prompt</label>
          <textarea
            value={config.wordcloudPrompt ?? ""}
            onChange={(e) => onChange({ ...config, wordcloudPrompt: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors resize-none"
            placeholder="What words come to mind when you think of…?"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-600 shrink-0">Max words per person</label>
          <input
            type="number"
            min={1}
            max={20}
            value={config.maxWords ?? 5}
            onChange={(e) => onChange({ ...config, maxWords: Number(e.target.value) })}
            className="w-20 px-3 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
          />
        </div>
      </div>
    );
}
