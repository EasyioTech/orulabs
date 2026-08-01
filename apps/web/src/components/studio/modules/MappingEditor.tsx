import React, { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, X, ToggleLeft, ToggleRight, LayoutTemplate, ListChecks, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { TrainingModule, ModuleConfig, FormField, FormFieldType } from "@oruclass/types";

export function MappingEditor({ module, config, onChange }: { module: TrainingModule; config: any; onChange: (c: any) => void }) {
  const focusAreas = (config.mappingFocusAreas as { id: string; title: string; numFields: number }[]) ?? [];
    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-700">Focus Areas</p>
          <button
            onClick={() =>
              onChange({
                ...config,
                mappingFocusAreas: [
                  ...focusAreas,
                  { id: crypto.randomUUID(), title: `Area ${focusAreas.length + 1}`, numFields: 3 },
                ],
              })
            }
            className="text-xs text-[#1a73e8] hover:text-brand-800 font-medium flex items-center gap-1"
          >
            <Plus size={11} /> Add area
          </button>
        </div>
        
        {focusAreas.length === 0 && (
          <div className="py-5 text-center bg-gray-50 rounded border border-dashed border-gray-100">
            <p className="text-xs text-gray-400">No focus areas added.</p>
          </div>
        )}

        {focusAreas.map((area: any, i: number) => (
          <div key={area.id} className="bg-gray-50 rounded border border-gray-100 p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase">Focus Area Title</label>
                <input
                  value={area.title}
                  onChange={(e) => {
                    const updated = focusAreas.map((x: any, j: number) => (j === i ? { ...x, title: e.target.value } : x));
                    onChange({ ...config, mappingFocusAreas: updated });
                  }}
                  className="w-full px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
                  placeholder="e.g. Strengths, Weaknesses"
                />
              </div>
              <button
                onClick={() => onChange({ ...config, mappingFocusAreas: focusAreas.filter((_: any, j: number) => j !== i) })}
                className="text-gray-300 hover:text-red-500 transition-colors mt-5 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-600 shrink-0">Number of input fields</label>
              <input
                type="number"
                min={1}
                max={20}
                value={area.numFields}
                onChange={(e) => {
                  const updated = focusAreas.map((x: any, j: number) => (j === i ? { ...x, numFields: Number(e.target.value) } : x));
                  onChange({ ...config, mappingFocusAreas: updated });
                }}
                className="w-16 px-2.5 py-1.5 border border-gray-100 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              />
            </div>
          </div>
        ))}
      </div>
    );
}
