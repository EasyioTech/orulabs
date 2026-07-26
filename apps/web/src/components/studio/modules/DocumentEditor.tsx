import React from "react";
import type { ModuleConfig } from "@oruclass/types";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { FileText } from "lucide-react";

export function DocumentEditor({
  config,
  onChange,
}: {
  config: ModuleConfig;
  onChange: (c: ModuleConfig) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
          <FileText size={20} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Collaborative Document</h3>
          <p className="text-sm text-gray-500">
            A real-time shared document where participants can write together.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Initial Content (Optional)
        </label>
        <p className="text-[13px] text-gray-500">
          Set up templates, prompts, or starting text for the document.
        </p>
        <RichTextEditor
          value={config.initialContent || ""}
          onChange={(html) => onChange({ ...config, initialContent: html })}
          placeholder="Start typing the initial document content..."
          minHeight="200px"
        />
      </div>
    </div>
  );
}
