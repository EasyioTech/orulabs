import React, { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, X, ToggleLeft, ToggleRight, LayoutTemplate, ListChecks, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { TrainingModule, ModuleConfig, FormField, FormFieldType, AttendanceField } from "@oruclass/types";

export function AttendanceEditor({ module, config, onChange }: { module: TrainingModule; config: any; onChange: (c: any) => void }) {
  const fields = (config.attendanceFields as AttendanceField[]) ?? [];
    const addField = () =>
      onChange({
        ...config,
        attendanceFields: [
          ...fields,
          { id: crypto.randomUUID(), label: "", type: "text", required: false },
        ],
      });
    const updateField = (i: number, patch: Partial<AttendanceField>) => {
      const updated = fields.map((f: any, j: number) => (j === i ? { ...f, ...patch } : f));
      onChange({ ...config, attendanceFields: updated });
    };
    const removeField = (i: number) =>
      onChange({ ...config, attendanceFields: fields.filter((_: any, j: number) => j !== i) });

    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-700">Custom fields</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Name is always collected automatically</p>
          </div>
          <button
            onClick={addField}
            className="flex items-center gap-1 text-sm text-[#1a73e8] hover:text-[#1557b0] font-medium"
          >
            <Plus size={12} /> Add field
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 border border-teal-200 rounded-xl">
          <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-xs text-teal-700 font-medium flex-1">Full Name</span>
          <span className="text-[10px] text-teal-500 bg-teal-100 rounded-full px-2 py-0.5">built-in · required</span>
        </div>

        {fields.length === 0 && (
          <div className="py-5 text-center bg-gray-50 rounded-xl border border-dashed border-gray-100">
            <p className="text-xs text-gray-400">No extra fields — only name will be collected.</p>
          </div>
        )}

        {fields.map((field: any, i: number) => (
          <div key={field.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={field.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
                className="flex-1 px-2.5 py-1.5 border border-gray-100 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Field label (e.g. Organization)"
              />
              <button
                onClick={() => removeField(i)}
                className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={field.type}
                onChange={(e) => updateField(i, { type: e.target.value as "text" | "email" | "tel" | "select" })}
                className="flex-1 px-2.5 py-1.5 border border-gray-100 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="tel">Phone</option>
                <option value="select">Dropdown</option>
              </select>
              <button
                onClick={() => updateField(i, { required: !field.required })}
                className={cn(
                  "flex items-center gap-1 text-[10px] font-semibold px-2.5 rounded-lg border transition-colors",
                  field.required
                    ? "bg-brand-50 border-brand-200 text-brand-700"
                    : "bg-white border-gray-100 text-gray-400",
                )}
              >
                {field.required ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                Required
              </button>
            </div>
            {field.type === "select" && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-500 font-medium">Options (one per line)</p>
                <textarea
                  rows={3}
                  value={(field.options ?? []).join("\n")}
                  onChange={(e) =>
                    updateField(i, { options: e.target.value.split("\n").filter(Boolean) })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-100 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder={"Option A\nOption B\nOption C"}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
}
