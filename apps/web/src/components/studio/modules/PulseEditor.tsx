import React, { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, X, ToggleLeft, ToggleRight, LayoutTemplate, ListChecks, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { TrainingModule, ModuleConfig, FormField, FormFieldType } from "@oruclass/types";

export function PulseEditor({ module, config, onChange }: { module: TrainingModule; config: any; onChange: (c: any) => void }) {
  const emojis = (config.pulseEmojis as string[]) ?? ["😊", "🙂", "😐", "😕", "😟"];
    return (
      <div className="space-y-3 mt-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Prompt</label>
          <input
            value={config.pulsePrompt ?? ""}
            onChange={(e) => onChange({ ...config, pulsePrompt: e.target.value })}
            className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            placeholder="How are you feeling about this topic?"
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-1.5">Emoji options (one per line)</p>
          <textarea
            rows={3}
            value={emojis.join("\n")}
            onChange={(e) => onChange({ ...config, pulseEmojis: e.target.value.split("\n").filter(Boolean) })}
            className="w-full px-3 py-2.5 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none font-mono"
            placeholder={"😊\n🙂\n😐\n😕\n😟"}
          />
        </div>
        <div className="flex gap-2">
          {emojis.map((e, i) => (
            <span key={i} className="text-2xl">{e}</span>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <label className="text-xs font-medium text-gray-600">Anonymous responses</label>
          <button
            onClick={() => onChange({ ...config, isAnonymous: !config.isAnonymous })}
            className={cn("flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-colors",
              config.isAnonymous ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-white border-gray-100 text-gray-400")}
          >
            {config.isAnonymous ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
            {config.isAnonymous ? "On" : "Off"}
          </button>
        </div>
      </div>
    );
}
