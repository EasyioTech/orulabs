import React, { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, X, ToggleLeft, ToggleRight, LayoutTemplate, ListChecks, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { TrainingModule, ModuleConfig, FormField, FormFieldType } from "@oruclass/types";

export function CustomEditor({ module, config, onChange }: { module: TrainingModule; config: any; onChange: (c: any) => void }) {
  const PRESET_COLORS = ["#fef9c3", "#dcfce7", "#dbeafe", "#fce7f3", "#ede9fe"];
    return (
      <div className="mt-4">
        <label className="text-xs font-semibold text-gray-700 block mb-2">Note background color</label>
        <div className="flex items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ ...config, backgroundColor: c })}
              style={{ background: c }}
              className={cn(
                "w-7 h-7 rounded-lg border-2 transition-all",
                config.backgroundColor === c ? "border-gray-700 scale-110 shadow" : "border-gray-100 hover:scale-105",
              )}
            />
          ))}
          <input
            type="color"
            value={config.backgroundColor ?? "#fef9c3"}
            onChange={(e) => onChange({ ...config, backgroundColor: e.target.value })}
            className="w-7 h-7 rounded-lg border border-gray-100 cursor-pointer overflow-hidden"
            title="Custom color"
          />
        </div>
      </div>
    );
}
