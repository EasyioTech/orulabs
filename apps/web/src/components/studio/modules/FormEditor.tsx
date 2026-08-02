import { Plus, X, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@oruclass/utils";
import type { TrainingModule, ModuleConfig, FormField, FormFieldType } from "@oruclass/types";

export function FormEditor({ config, onChange }: { module: TrainingModule; config: ModuleConfig; onChange: (c: ModuleConfig) => void }) {
  const fields = config.formFields ?? [];
    const addField = () =>
      onChange({
        ...config,
        formFields: [
          ...fields,
          { id: crypto.randomUUID(), type: "short_text", label: "", required: false },
        ],
      });
    const updateField = (i: number, patch: Partial<FormField>) => {
      const updated = fields.map((f, j) => (j === i ? { ...f, ...patch } : f));
      onChange({ ...config, formFields: updated });
    };
    const removeField = (i: number) =>
      onChange({ ...config, formFields: fields.filter((_, j) => j !== i) });

    return (
      <div className="space-y-4 mt-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Form Title</label>
          <input
            value={config.formTitle ?? ""}
            onChange={(e) => onChange({ ...config, formTitle: e.target.value })}
            className="w-full px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
            placeholder="e.g. Feedback Form"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Form Description</label>
          <textarea
            value={config.formDescription ?? ""}
            onChange={(e) => onChange({ ...config, formDescription: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors resize-none"
            placeholder="Please fill out this form..."
          />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-semibold text-gray-700">Form Fields</p>
          <button
            onClick={addField}
            className="flex items-center gap-1 text-sm text-[#1a73e8] hover:text-[#1557b0] font-medium"
          >
            <Plus size={12} /> Add field
          </button>
        </div>

        {fields.length === 0 && (
          <div className="py-5 text-center bg-gray-50 rounded border border-dashed border-gray-100">
            <p className="text-xs text-gray-400">No fields added yet.</p>
          </div>
        )}

        {fields.map((field, i) => (
          <div key={field.id} className="bg-gray-50 rounded border border-gray-100 p-3 space-y-3">
            <div className="flex items-start gap-2">
              <input
                value={field.label}
                onChange={(e) => updateField(i, { label: e.target.value })}
                className="flex-1 px-2.5 py-1.5 border border-gray-100 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                placeholder="Question / Label"
              />
              <button
                onClick={() => removeField(i)}
                className="text-gray-300 hover:text-red-500 transition-colors mt-1 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={field.type}
                onChange={(e) => updateField(i, { type: e.target.value as FormFieldType })}
                className="flex-1 px-2.5 py-1.5 border border-gray-100 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
              >
                <option value="short_text">Short Text</option>
                <option value="long_text">Paragraph</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="checkboxes">Checkboxes</option>
                <option value="dropdown">Dropdown</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
              </select>
              <button
                onClick={() => updateField(i, { required: !field.required })}
                className={cn(
                  "flex items-center gap-1 text-[10px] font-semibold px-2.5 rounded-lg border transition-colors",
                  field.required
                    ? "bg-[#e8f0fe] border-[#d2e3fc] text-[#1557b0]"
                    : "bg-white border-gray-100 text-gray-400",
                )}
              >
                {field.required ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                Required
              </button>
            </div>
            {["multiple_choice", "checkboxes", "dropdown"].includes(field.type) && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-500 font-medium">Options (one per line)</p>
                <textarea
                  rows={3}
                  value={(field.options ?? []).join("\n")}
                  onChange={(e) =>
                    updateField(i, { options: e.target.value.split("\n").filter(Boolean) })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-100 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8] resize-none"
                  placeholder={"Option A\nOption B\nOption C"}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
}

