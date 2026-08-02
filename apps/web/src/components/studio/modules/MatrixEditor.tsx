import { Plus, X } from "lucide-react";
import type { TrainingModule, ModuleConfig } from "@oruclass/types";

export function MatrixEditor({ config, onChange }: { module: TrainingModule; config: ModuleConfig; onChange: (c: ModuleConfig) => void }) {
  const rows = config.rows ?? ["Row 1"];
    const cols = config.columns ?? ["Col 1"];
    return (
      <div className="space-y-4 mt-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">Rows</p>
            <button
              onClick={() => onChange({ ...config, rows: [...rows, `Row ${rows.length + 1}`] })}
              className="text-xs text-[#1a73e8] hover:text-brand-800 font-medium flex items-center gap-1"
            >
              <Plus size={11} /> Add row
            </button>
          </div>
          <div className="space-y-1.5">
            {rows.map((r, i) => (
              <div key={i} className="flex gap-1.5">
                <input
                  value={r}
                  onChange={(e) => {
                    const updated = rows.map((x, j) => (j === i ? e.target.value : x));
                    onChange({ ...config, rows: updated });
                  }}
                  className="flex-1 px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
                />
                <button
                  onClick={() => onChange({ ...config, rows: rows.filter((_, j) => j !== i) })}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-700">Columns</p>
            <button
              onClick={() => onChange({ ...config, columns: [...cols, `Col ${cols.length + 1}`] })}
              className="text-xs text-[#1a73e8] hover:text-brand-800 font-medium flex items-center gap-1"
            >
              <Plus size={11} /> Add column
            </button>
          </div>
          <div className="space-y-1.5">
            {cols.map((c, i) => (
              <div key={i} className="flex gap-1.5">
                <input
                  value={c}
                  onChange={(e) => {
                    const updated = cols.map((x, j) => (j === i ? e.target.value : x));
                    onChange({ ...config, columns: updated });
                  }}
                  className="flex-1 px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
                />
                <button
                  onClick={() => onChange({ ...config, columns: cols.filter((_, j) => j !== i) })}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
}
