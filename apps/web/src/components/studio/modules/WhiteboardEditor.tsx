import React from "react";
import type { TrainingModule, ModuleConfig } from "@oruclass/types";

export function WhiteboardEditor({ module, config, onChange }: { module: TrainingModule; config: any; onChange: (c: any) => void }) {
  return (
    <div className="mt-4">
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4">
        <p className="text-xs text-indigo-700 font-medium">
          Whiteboard has been upgraded to a premium infinite canvas using tldraw! You no longer need to specify canvas dimensions.
        </p>
      </div>
      <label className="text-xs font-semibold text-gray-700 block mb-1.5">Initial Instructions (Optional)</label>
      <textarea
        value={config.prompt ?? ""}
        onChange={(e) => onChange({ ...config, prompt: e.target.value })}
        rows={3}
        className="w-full px-4 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors resize-none"
        placeholder="What should participants draw or map out?"
      />
    </div>
  );
}
