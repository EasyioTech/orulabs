"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { TrainingModule, ModuleConfig } from "@oruclass/types";
import { useUpdateModule, useDuplicateModule, useAssignModuleToDay } from "@/hooks/useModules";
import { useDays } from "@/hooks/useDays";
import { useTrainings } from "@/hooks/useTrainings";
import { apiClient } from "@/lib/api-client";
import { cn } from "@oruclass/utils";
import {
  GripVertical,
  ClipboardList,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  MoveRight,
  MoreVertical,
} from "lucide-react";
import { getModuleDef } from "./moduleTypes";
import { useStudioCan } from "./studioRole";
import { ModuleConfigEditor } from "./ModuleConfigEditor";

export function SortableModuleCard({
  module,
  index,
  workspaceId,
  trainingId,
  isExpanded = false,
  onToggle,
  onClose,
}: {
  module: TrainingModule;
  index: number;
  workspaceId: string;
  trainingId: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
  const canEdit = useStudioCan("edit_modules");
  const qc = useQueryClient();
  const [localConfig, setLocalConfig] = useState<ModuleConfig>(module.config);

  const updateModule = useUpdateModule(workspaceId, trainingId);
  const assignToDay = useAssignModuleToDay(workspaceId, trainingId);
  const duplicateModule = useDuplicateModule(workspaceId, trainingId);
  const { data: daysList = [] } = useDays(workspaceId, trainingId);
  const { data: trainingsList = [] } = useTrainings(workspaceId);
  const [copyTargetTrainingId, setCopyTargetTrainingId] = useState<string>(trainingId);
  const [copyTargetDayId, setCopyTargetDayId] = useState<string>("");
  const deleteModule = useMutation({
    mutationFn: () =>
      apiClient.delete(`/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${module.id}`, {
        headers: { "X-Workspace-ID": workspaceId },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", trainingId] });
      qc.invalidateQueries({ queryKey: ["days", trainingId] });
    },
  });

  const saveConfig = () => {
    updateModule.mutate({ moduleId: module.id, data: { config: localConfig } });
    onClose?.();
  };

  const toggleAlwaysOn = () => {
    updateModule.mutate({ moduleId: module.id, data: { isAlwaysOn: !module.isAlwaysOn } });
  };

  const def = getModuleDef(module.moduleType);
  const { Icon } = def;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={(e) => {
        if (canEdit && !isExpanded && !isDragging) {
          e.stopPropagation();
          if (onToggle) onToggle();
        }
      }}
      className={cn(
        "bg-white rounded-lg overflow-hidden transition-all",
        canEdit && !isExpanded ? "cursor-pointer hover:shadow-sm" : "",
        isDragging ? "shadow-lg opacity-90 scale-[1.01] border border-[#dadce0]" : isExpanded ? "shadow-sm border border-[#dadce0] my-3" : "border border-[#dadce0]",
      )}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3">
        {canEdit && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors shrink-0 touch-none"
          >
            <GripVertical size={18} />
          </div>
        )}

        <div className={cn("w-8 h-8 rounded flex items-center justify-center shrink-0", def.bg)}>
          <Icon size={16} className={def.color} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-[15px] font-semibold text-gray-900 truncate leading-tight">{module.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-400">
            <span className="truncate">{def.label}</span>
            {module.moduleType === "attendance" ? (
              <span className="inline-flex items-center gap-1 text-teal-600 font-semibold">
                <span className="text-gray-300">·</span>
                <ClipboardList size={10} /> First
              </span>
            ) : (
              <span className="text-gray-300">· #{index + 1}</span>
            )}
          </div>
        </div>

        {module.moduleType === "attendance" ? (
          <div className="shrink-0 flex items-center gap-1.5 text-[11px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-medium">
            <Eye size={12} />
            <span className="hidden sm:inline">Always visible</span>
          </div>
        ) : canEdit ? (
          <button
            onClick={toggleAlwaysOn}
            title={
              module.isAlwaysOn
                ? "Always visible to participants (click to restrict)"
                : "Participants can only see this when trainer activates it (click to make always visible)"
            }
            className={cn(
              "shrink-0 flex items-center gap-1.5 text-[11px] px-2 py-1 rounded font-medium transition-colors",
              module.isAlwaysOn
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700",
            )}
          >
            {module.isAlwaysOn ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className="hidden sm:inline">{module.isAlwaysOn ? "Always visible" : "On demand"}</span>
          </button>
        ) : (
          <div
            className={cn(
              "shrink-0 flex items-center gap-1.5 text-[11px] px-2 py-1 rounded font-medium",
              module.isAlwaysOn
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-50 text-gray-500",
            )}
          >
            {module.isAlwaysOn ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className="hidden sm:inline">{module.isAlwaysOn ? "Always visible" : "On demand"}</span>
          </div>
        )}

        {canEdit && (
        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors outline-none"
                title="Module actions"
              >
                <MoreVertical size={16} />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={5}
                className="z-50 w-48 bg-white rounded shadow-sm border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              >
                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1a73e8] cursor-pointer outline-none transition-colors">
                    <div className="flex items-center gap-2">
                      <MoveRight size={15} className="text-gray-400" />
                      Move to day
                    </div>
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent sideOffset={2} alignOffset={-5} className="z-50 w-48 bg-white rounded shadow-sm border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <DropdownMenu.Item
                        onClick={() => assignToDay.mutate({ moduleId: module.id, dayId: null })}
                        disabled={assignToDay.isPending || module.dayId == null}
                        className={cn("px-3 py-2 text-sm cursor-pointer outline-none transition-colors truncate", module.dayId == null ? "bg-[#e8f0fe] text-[#1557b0] font-medium" : "text-gray-700 hover:bg-gray-50 hover:text-[#1a73e8]", assignToDay.isPending || module.dayId == null ? "opacity-50 cursor-not-allowed" : "")}
                      >
                        Unassigned
                      </DropdownMenu.Item>
                      {daysList.map((d) => (
                        <DropdownMenu.Item
                          key={d.id}
                          onClick={() => assignToDay.mutate({ moduleId: module.id, dayId: d.id })}
                          disabled={assignToDay.isPending || module.dayId === d.id}
                          className={cn("px-3 py-2 text-sm cursor-pointer outline-none transition-colors truncate", module.dayId === d.id ? "bg-[#e8f0fe] text-[#1557b0] font-medium" : "text-gray-700 hover:bg-gray-50 hover:text-[#1a73e8]", assignToDay.isPending || module.dayId === d.id ? "opacity-50 cursor-not-allowed" : "")}
                        >
                          Day {d.dayNumber} · {d.title}
                        </DropdownMenu.Item>
                      ))}
                      {daysList.length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-400 italic">No days yet</div>
                      )}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>

                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#1a73e8] cursor-pointer outline-none transition-colors">
                    <div className="flex items-center gap-2">
                      <Copy size={15} className="text-gray-400" />
                      Copy module
                    </div>
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent sideOffset={2} alignOffset={-5} className="z-50 w-56 bg-white rounded shadow-sm border border-gray-100 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">Target training</label>
                          <select
                            value={copyTargetTrainingId}
                            onChange={(e) => { setCopyTargetTrainingId(e.target.value); setCopyTargetDayId(""); }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-xs border border-gray-100 rounded-md px-2 py-1.5 bg-white focus:ring-1 focus:ring-[#1a73e8] outline-none"
                          >
                            {trainingsList.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.id === trainingId ? `${t.title} (current)` : t.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">Target day (optional)</label>
                          <select
                            value={copyTargetDayId}
                            onChange={(e) => setCopyTargetDayId(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-xs border border-gray-100 rounded-md px-2 py-1.5 bg-white focus:ring-1 focus:ring-[#1a73e8] outline-none"
                          >
                            <option value="">Unassigned</option>
                            {daysList.map((d) => (
                              <option key={d.id} value={d.id}>
                                Day {d.dayNumber} · {d.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateModule.mutate({
                              moduleId: module.id,
                              targetTrainingId: copyTargetTrainingId,
                              targetDayId: copyTargetDayId || null,
                            });
                          }}
                          disabled={duplicateModule.isPending}
                          className="w-full text-xs bg-[#1a73e8] text-white font-medium py-1.5 rounded-md hover:bg-[#1557b0] transition-colors disabled:opacity-50"
                        >
                          {duplicateModule.isPending ? "Copying..." : "Confirm copy"}
                        </button>
                      </div>
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>


              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        )}
      </div>


      {isExpanded && (
        <div className="border-t border-[#dadce0] px-4 pb-4">
          <ModuleConfigEditor module={module} config={localConfig} onChange={setLocalConfig} />
          {canEdit && (
            <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-[#dadce0]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${module.title}"?`)) deleteModule.mutate();
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-full transition-colors"
                title="Delete module"
              >
                <Trash2 size={20} />
              </button>
              <div className="w-[1px] h-6 bg-[#dadce0]" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose?.();
                }}
                className="px-4 py-2 text-[#1a73e8] hover:bg-blue-50/50 rounded-md text-sm font-medium transition-colors"
              >
                Done
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  saveConfig();
                }}
                disabled={updateModule.isPending}
                className="px-6 py-2 bg-[#1a73e8] text-white rounded-md text-sm font-medium hover:bg-[#1557b0] shadow-sm disabled:opacity-60 transition-colors"
              >
                {updateModule.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
