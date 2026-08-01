import React from "react";
import type { TrainingModule, ModuleConfig } from "@oruclass/types";

export function CodeEditor({ module, config, onChange }: { module: TrainingModule; config: ModuleConfig; onChange: (c: ModuleConfig) => void }) {
  return (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1.5">Challenge Prompt</label>
        <textarea
          value={config.codePrompt ?? ""}
          onChange={(e) => onChange({ ...config, codePrompt: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors resize-none"
          placeholder="Describe the coding challenge..."
        />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-gray-700 shrink-0">Language</label>
        <select
          value={config.codeLanguage ?? "javascript"}
          onChange={(e) => onChange({ ...config, codeLanguage: e.target.value })}
          className="w-48 px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
        >
          <option value="javascript">JavaScript / Node</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="html">HTML / CSS</option>
          <option value="cpp">C++</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1.5">Initial Boilerplate Code</label>
        <textarea
          value={config.initialCode ?? ""}
          onChange={(e) => onChange({ ...config, initialCode: e.target.value })}
          rows={6}
          className="w-full px-4 py-2 font-mono bg-slate-900 text-slate-100 rounded text-xs outline-none transition-colors resize-none shadow-inner"
          placeholder="// function solve() { ... }"
        />
      </div>
    </div>
  );
}
