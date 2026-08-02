import { ChevronUp, ChevronDown, Trash2, Plus, X } from "lucide-react";
import type { TrainingModule, ModuleConfig } from "@oruclass/types";

export function EmbedEditor({ module, config, onChange }: { module: TrainingModule; config: ModuleConfig; onChange: (c: ModuleConfig) => void }) {
if (module.moduleType === "embed") {
    // Migration from old single-embed structure
    const embeds = config.embeds || (config.embedUrl ? [{ id: crypto.randomUUID(), url: config.embedUrl, title: config.embedTitle, description: config.embedDescription }] : []);
    type Embed = (typeof embeds)[number];

    const addEmbed = () => onChange({ ...config, embeds: [...embeds, { id: crypto.randomUUID(), url: "" }] });

    const updateEmbed = (i: number, patch: Partial<Embed>) => {
      const updated = embeds.map((e, j) => j === i ? { ...e, ...patch } : e);
      onChange({ ...config, embeds: updated });
    };

    const removeEmbed = (i: number) => {
      onChange({ ...config, embeds: embeds.filter((_, j) => j !== i) });
    };

    const moveEmbed = (i: number, dir: -1 | 1) => {
      if (i + dir < 0 || i + dir >= embeds.length) return;
      const updated = [...embeds];
      const temp = updated[i];
      updated[i] = updated[i + dir];
      updated[i + dir] = temp;
      onChange({ ...config, embeds: updated });
    };

    return (
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-semibold text-gray-700">Embedded Resources</p>
          <button
            onClick={addEmbed}
            className="flex items-center gap-1 text-sm text-[#1a73e8] hover:text-[#1557b0] font-medium"
          >
            <Plus size={12} /> Add embed
          </button>
        </div>

        {embeds.length === 0 && (
          <div className="py-5 text-center bg-gray-50 rounded border border-dashed border-gray-100">
            <p className="text-xs text-gray-400">No resources added yet.</p>
          </div>
        )}

        {embeds.map((embed, i) => (
          <div key={embed.id} className="bg-gray-50 rounded border border-gray-100 p-3 space-y-3 relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Embed {i + 1}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => moveEmbed(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30"><ChevronUp size={14}/></button>
                <button onClick={() => moveEmbed(i, 1)} disabled={i === embeds.length - 1} className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30"><ChevronDown size={14}/></button>
                <button onClick={() => removeEmbed(i)} className="p-1 text-red-400 hover:text-red-600 ml-2"><Trash2 size={14}/></button>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1">Link / URL</label>
              <input
                type="url"
                value={embed.url ?? ""}
                onChange={(e) => updateEmbed(i, { url: e.target.value })}
                className="w-full px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1">Title (optional)</label>
              <input
                value={embed.title ?? ""}
                onChange={(e) => updateEmbed(i, { title: e.target.value })}
                className="w-full px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
                placeholder="Title to display above embed"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1">Description (optional)</label>
              <textarea
                value={embed.description ?? ""}
                onChange={(e) => updateEmbed(i, { description: e.target.value })}
                rows={2}
                className="w-full px-2.5 py-1.5 border border-gray-100 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1a73e8] resize-none"
                placeholder="Add some context or instructions..."
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

    return null;

}

