"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@oruclass/utils";
import { useTraining, useUpdateTraining } from "@/hooks/useTrainings";
import { useStudioCan } from "./studioRole";

type ChecklistItem = { id: string; label: string; done: boolean };

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "seed-days", label: "Organise into days", done: false },
  { id: "seed-module", label: "Add at least one module", done: false },
  { id: "seed-flow", label: "Create a full flow (2+ modules)", done: false },
];

export function SessionChecklist({ workspaceId, trainingId }: { workspaceId: string; trainingId: string }) {
  const { data: training } = useTraining(workspaceId, trainingId);
  const updateTraining = useUpdateTraining(workspaceId, trainingId);
  const canEdit = useStudioCan("edit_agenda");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ChecklistItem[]>([]);

  const items: ChecklistItem[] =
    training?.checklist && training.checklist.length > 0 ? training.checklist : DEFAULT_CHECKLIST;

  const toggle = (id: string) => {
    if (!canEdit || updateTraining.isPending) return;
    updateTraining.mutate({
      checklist: items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)),
    });
  };

  const startEdit = () => {
    setDraft(items.map((it) => ({ ...it })));
    setEditing(true);
  };
  const save = () => {
    const cleaned = draft.map((d) => ({ ...d, label: d.label.trim() })).filter((d) => d.label);
    updateTraining.mutate({ checklist: cleaned }, { onSuccess: () => setEditing(false) });
  };

  return (
    <div className="bg-white rounded-lg border border-[#dadce0] overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Session checklist</h2>
        {!editing && canEdit && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1 text-[11px] text-[#1a73e8] hover:text-brand-800 font-semibold"
          >
            <Pencil size={11} />
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="p-4 space-y-2.5">
          {draft.map((d, i) => (
            <div key={d.id} className="flex items-center gap-2">
              <input
                value={d.label}
                onChange={(e) =>
                  setDraft((prev) => prev.map((p) => (p.id === d.id ? { ...p, label: e.target.value } : p)))
                }
                placeholder="Checklist item…"
                className="flex-1 px-3 py-2 bg-[#f1f3f4] border-b border-[#80868b] focus:border-b-2 focus:border-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
              />
              <button
                onClick={() => setDraft((prev) => prev.filter((_, idx) => idx !== i))}
                className="shrink-0 p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                aria-label="Remove item"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setDraft((prev) => [...prev, { id: crypto.randomUUID(), label: "", done: false }])
            }
            className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1a73e8] hover:text-brand-800"
          >
            <Plus size={13} /> Add item
          </button>
          {updateTraining.isError && <p className="text-xs text-red-500">Failed to save.</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setEditing(false)}
              className="flex-1 py-1.5 text-[#1a73e8] bg-transparent rounded-full text-xs font-medium hover:bg-blue-50/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={updateTraining.isPending}
              className="flex-1 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-medium disabled:opacity-60 transition-colors shadow-sm"
            >
              {updateTraining.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-2.5">
          {items.map((t) => (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              disabled={!canEdit}
              className={cn(
                "w-full flex items-start gap-2.5 text-left rounded-lg -mx-1 px-1 py-0.5",
                canEdit && "hover:bg-gray-50 transition-colors",
              )}
            >
              {t.done ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
              ) : (
                <XCircle size={16} className="mt-0.5 shrink-0 text-gray-300" />
              )}
              <p className={cn("text-xs font-semibold text-gray-700", t.done && "line-through text-gray-400")}>
                {t.label}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
