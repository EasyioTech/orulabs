"use client";

import { useState } from "react";
import type { TrainingModule } from "@oruclass/types";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useReorderModules } from "@/hooks/useModules";
import { useStudioCan } from "./studioRole";
import { SortableModuleCard } from "./SortableModuleCard";
import { AddModuleDrawer } from "./AddModuleDrawer";

export function DayModuleList({
  modules,
  workspaceId,
  trainingId,
  dayId,
}: {
  modules: TrainingModule[];
  workspaceId: string;
  trainingId: string;
  dayId: string | null;
}) {
  const reorderModules = useReorderModules(workspaceId, trainingId);
  const [adding, setAdding] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const canEdit = useStudioCan("edit_modules");

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canEdit) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIndex, newIndex);
    reorderModules.mutate(reordered.map((m, i) => ({ id: m.id, position: i })));
  };

  return (
    <div className="space-y-3">
      {adding && canEdit && (
        <AddModuleDrawer
          onClose={() => setAdding(false)}
          workspaceId={workspaceId}
          trainingId={trainingId}
          position={modules.length}
          dayId={dayId}
        />
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2.5">
            {modules.map((m, i) => (
              <SortableModuleCard
                key={m.id}
                module={m}
                index={i}
                workspaceId={workspaceId}
                trainingId={trainingId}
                isExpanded={expandedModuleId === m.id}
                onToggle={() => setExpandedModuleId(expandedModuleId === m.id ? null : m.id)}
                onClose={() => setExpandedModuleId(null)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {modules.length === 0 && !adding && canEdit && (
        <div
          className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-[#dadce0] cursor-pointer hover:border-[#1a73e8] hover:bg-[#f1f3f4] transition-all group"
          onClick={() => setAdding(true)}
        >
          <div className="w-10 h-10 rounded bg-[#d2e3fc] group-hover:bg-brand-200 flex items-center justify-center mb-2.5 transition-colors">
            <Plus size={18} className="text-[#1a73e8] group-hover:text-[#1557b0] transition-colors" />
          </div>
          <p className="text-sm font-semibold text-[#1557b0]">
            Add first module for this day
          </p>
          <p className="text-xs text-[#1a73e8]/80 mt-1">Quiz, whiteboard, reflection, matrix, or sticky notes</p>
        </div>
      )}

      {modules.length === 0 && !canEdit && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-[#dadce0]">
          <p className="text-sm font-medium text-gray-400">No modules for this day</p>
        </div>
      )}

      {!adding && modules.length > 0 && canEdit && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-md bg-white border border-[#dadce0] text-[#1a73e8] font-medium text-sm hover:bg-[#f8f9fa] hover:border-[#1a73e8] transition-all group shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          Add module
        </button>
      )}
    </div>
  );
}
