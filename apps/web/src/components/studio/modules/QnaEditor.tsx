import React, { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, X, ToggleLeft, ToggleRight, LayoutTemplate, ListChecks, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { TrainingModule, ModuleConfig, FormField, FormFieldType } from "@oruclass/types";

export function QnaEditor({ module, config, onChange }: { module: TrainingModule; config: any; onChange: (c: any) => void }) {
  return (
      <div className="space-y-3 mt-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Instructions for participants</label>
          <textarea
            value={config.qnaPrompt ?? ""}
            onChange={(e) => onChange({ ...config, qnaPrompt: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors resize-none"
            placeholder="Ask any questions about the session…"
          />
        </div>
      </div>
    );
}
