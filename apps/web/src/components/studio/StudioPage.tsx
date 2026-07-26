"use client";

import { createContext, useContext, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useModules, useReorderModules, useUpdateModule, useDuplicateModule, useAssignModuleToDay } from "@/hooks/useModules";
import { useDays, useCreateDay, useDeleteDay, useUpdateDay } from "@/hooks/useDays";
import { useWorkspaceStore } from "@/store/workspace";
import { useWorkspaceMembers } from "@/hooks/useWorkspace";
import { useAssignFacilitator, useTraining, useInviteFacilitator, useCancelFacilitatorInvitation, useResendFacilitatorInvitation, useTrainings, useUpdateTraining, useMyTrainingRole } from "@/hooks/useTrainings";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { apiClient } from "@/lib/api-client";
import { isAxiosError } from "axios";
import { canDo } from "@/lib/permissions";
import type { TrainingModule, TrainingRole, ModuleConfig, AttendanceField, TrainingDay, FormField, FormFieldType } from "@oruclass/types";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { cn } from "@oruclass/utils";
import type { Permission } from "@oruclass/utils";
import {
  GripVertical,
  ListChecks,
  PenLine,
  BookOpen,
  Table2,
  StickyNote,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  X,
  XCircle,
  UserPlus,
  Users,
  CheckCircle2,
  Radio,
  ToggleLeft,
  ToggleRight,
  CalendarDays,
  Calendar,
  Pencil,
  AlertTriangle,
  Copy,
  MoveRight,
  MoreVertical,
  BarChart3,
  Cloud,
  MessageCircleQuestion,
  Timer,
  Heart,
  Network,
  FileText,
  Link2,
  Lock,
} from "lucide-react";
import { SafeHTML } from "@/components/ui/SafeHTML";

// ─── Role context ────────────────────────────────────────────────────────────
// Current user's training role, provided once at StudioPage root so deeply nested
// cards/panels can gate mutating controls without prop-drilling. `undefined` =
// not a facilitator (participant / still loading) → no edit rights.
const StudioRoleContext = createContext<TrainingRole | undefined>(undefined);

function useStudioRole(): TrainingRole | undefined {
  return useContext(StudioRoleContext);
}

function useStudioCan(permission: Permission): boolean {
  return canDo(useStudioRole(), permission);
}

// ─── Module type config ──────────────────────────────────────────────────────

const MODULE_TYPES = [
  {
    type: "attendance",
    label: "Attendance",
    description: "Collect participant info — always the first module",
    Icon: ClipboardList,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    activeBg: "bg-teal-600",
  },
  {
    type: "quiz",
    label: "Quiz",
    description: "Multiple choice, short answer, or true/false questions",
    Icon: ListChecks,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    activeBg: "bg-violet-600",
  },
  {
    type: "whiteboard",
    label: "Whiteboard",
    description: "Free-draw collaborative canvas",
    Icon: PenLine,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    activeBg: "bg-blue-600",
  },
  {
    type: "reflection",
    label: "Reflection Journal",
    description: "Prompted written response for participants",
    Icon: BookOpen,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    activeBg: "bg-emerald-600",
  },
  {
    type: "matrix",
    label: "Matrix",
    description: "Row × column grid for structured input",
    Icon: Table2,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    activeBg: "bg-amber-600",
  },
  {
    type: "custom",
    label: "Sticky Notes",
    description: "Post-it style group brainstorm board",
    Icon: StickyNote,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200",
    activeBg: "bg-pink-600",
  },
  {
    type: "poll",
    label: "Poll",
    description: "Live voting with real-time bar chart results",
    Icon: BarChart3,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    activeBg: "bg-indigo-600",
  },
  {
    type: "wordcloud",
    label: "Word Cloud",
    description: "Participants submit words — see a live word cloud",
    Icon: Cloud,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    activeBg: "bg-cyan-600",
  },
  {
    type: "qna",
    label: "Q&A Board",
    description: "Participants submit questions for the trainer",
    Icon: MessageCircleQuestion,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    activeBg: "bg-sky-600",
  },
  {
    type: "timer",
    label: "Timer",
    description: "Shared countdown timer for timed activities",
    Icon: Timer,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    activeBg: "bg-orange-600",
  },
  {
    type: "pulse",
    label: "Pulse Check",
    description: "Quick emoji mood check — gauge the room instantly",
    Icon: Heart,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    activeBg: "bg-rose-600",
  },
  {
    type: "mapping",
    label: "Mapping",
    description: "Create focus areas with custom input fields",
    Icon: Network,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    activeBg: "bg-purple-600",
  },
  {
    type: "form",
    label: "Custom Form",
    description: "Build custom forms with various input types",
    Icon: FileText,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    activeBg: "bg-indigo-600",
  },
  {
    type: "embed",
    label: "Embed / Link",
    description: "Embed an external link or content directly",
    Icon: Link2,
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    activeBg: "bg-gray-600",
  },
] as const;

type ModuleTypeDef = (typeof MODULE_TYPES)[number];

function getModuleDef(type: string): ModuleTypeDef {
  return (MODULE_TYPES.find((m) => m.type === type) ?? MODULE_TYPES[0]) as ModuleTypeDef;
}

const FACILITATOR_ROLES: { value: TrainingRole; label: string; description: string }[] = [
  { value: "lead_trainer", label: "Lead Trainer", description: "Full control over the session" },
  { value: "full_editor", label: "Full Editor", description: "Can edit content and modules" },
  { value: "partial_editor", label: "Partial Editor", description: "Limited editing access" },
  { value: "facilitation_support", label: "Support", description: "Read-only + chat participation" },
];

// ─── Module config editors ───────────────────────────────────────────────────

import { ModuleConfigEditor } from "./ModuleConfigEditor";


// ─── Sortable module card ────────────────────────────────────────────────────

function SortableModuleCard({
  module,
  index,
  workspaceId,
  trainingId,
}: {
  module: TrainingModule;
  index: number;
  workspaceId: string;
  trainingId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
  const canEdit = useStudioCan("edit_modules");
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
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
    setExpanded(false);
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
      className={cn(
        "bg-white rounded-lg border border-[#dadce0] overflow-hidden transition-shadow",
        isDragging ? "shadow-lg opacity-80 rotate-1" : "shadow-sm hover:shadow-md",
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

        <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0", def.bg)}>
          <Icon size={17} className={def.color} />
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
          <div className="shrink-0 flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700 font-medium">
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
              "shrink-0 flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full border font-medium transition-all",
              module.isAlwaysOn
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600",
            )}
          >
            {module.isAlwaysOn ? <Eye size={12} /> : <EyeOff size={12} />}
            <span className="hidden sm:inline">{module.isAlwaysOn ? "Always visible" : "On demand"}</span>
          </button>
        ) : (
          <div
            className={cn(
              "shrink-0 flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-full border font-medium",
              module.isAlwaysOn
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "border-gray-100 text-gray-400",
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
                className="z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              >
                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 cursor-pointer outline-none transition-colors">
                    <div className="flex items-center gap-2">
                      <MoveRight size={15} className="text-gray-400" />
                      Move to day
                    </div>
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent sideOffset={2} alignOffset={-5} className="z-50 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <DropdownMenu.Item
                        onClick={() => assignToDay.mutate({ moduleId: module.id, dayId: null })}
                        disabled={assignToDay.isPending || module.dayId == null}
                        className={cn("px-3 py-2 text-sm cursor-pointer outline-none transition-colors truncate", module.dayId == null ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-700 hover:bg-gray-50 hover:text-brand-600", assignToDay.isPending || module.dayId == null ? "opacity-50 cursor-not-allowed" : "")}
                      >
                        Unassigned
                      </DropdownMenu.Item>
                      {daysList.map((d) => (
                        <DropdownMenu.Item
                          key={d.id}
                          onClick={() => assignToDay.mutate({ moduleId: module.id, dayId: d.id })}
                          disabled={assignToDay.isPending || module.dayId === d.id}
                          className={cn("px-3 py-2 text-sm cursor-pointer outline-none transition-colors truncate", module.dayId === d.id ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-700 hover:bg-gray-50 hover:text-brand-600", assignToDay.isPending || module.dayId === d.id ? "opacity-50 cursor-not-allowed" : "")}
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
                  <DropdownMenu.SubTrigger className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 cursor-pointer outline-none transition-colors">
                    <div className="flex items-center gap-2">
                      <Copy size={15} className="text-gray-400" />
                      Copy module
                    </div>
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent sideOffset={2} alignOffset={-5} className="z-50 w-56 bg-white rounded-xl shadow-lg border border-gray-100 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">Target training</label>
                          <select
                            value={copyTargetTrainingId}
                            onChange={(e) => { setCopyTargetTrainingId(e.target.value); setCopyTargetDayId(""); }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-xs border border-gray-100 rounded-md px-2 py-1.5 bg-white focus:ring-1 focus:ring-brand-500 outline-none"
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
                            className="w-full text-xs border border-gray-100 rounded-md px-2 py-1.5 bg-white focus:ring-1 focus:ring-brand-500 outline-none"
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
                          className="w-full text-xs bg-brand-600 text-white font-medium py-1.5 rounded-md hover:bg-brand-700 transition-colors disabled:opacity-50"
                        >
                          {duplicateModule.isPending ? "Copying..." : "Confirm copy"}
                        </button>
                      </div>
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>

                <DropdownMenu.Item
                  onClick={() => { setExpanded((v) => !v); setMoveOpen(false); setCopyOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 cursor-pointer outline-none transition-colors"
                >
                  {expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                  {expanded ? "Close config" : "Configure module"}
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="h-[1px] bg-gray-100 my-1" />

                <DropdownMenu.Item
                  onClick={() => {
                    if (confirm(`Delete "${module.title}"?`)) deleteModule.mutate();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none transition-colors"
                >
                  <Trash2 size={15} className="text-red-500 opacity-70" />
                  Delete module
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        )}
      </div>


      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4">
          <ModuleConfigEditor module={module} config={localConfig} onChange={setLocalConfig} />
          <button
            onClick={saveConfig}
            disabled={updateModule.isPending}
            className="mt-4 w-full py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {updateModule.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Add module drawer ───────────────────────────────────────────────────────

function AddModuleDrawer({
  onClose,
  workspaceId,
  trainingId,
  position,
  dayId,
}: {
  onClose: () => void;
  workspaceId: string;
  trainingId: string;
  position: number;
  dayId: string | null;
}) {
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const addModule = useMutation({
    mutationFn: (type: string) => {
      const def = getModuleDef(type);
      const effectivePosition = type === "attendance" ? 0 : position;
      return apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules`,
        {
          title: def.label,
          moduleType: type,
          position: effectivePosition,
          isAlwaysOn: type === "attendance",
          dayId: dayId,
        },
        { headers: { "X-Workspace-ID": workspaceId } },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", trainingId] });
      qc.invalidateQueries({ queryKey: ["days", trainingId] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-4xl rounded-t-xl sm:rounded-2xl border-t sm:border border-gray-100 shadow-xl max-h-[88vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Add a module</h3>
            <p className="text-xs text-gray-400 mt-0.5">Pick an activity to add to this day</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 sm:px-6 py-4 sm:py-6 bg-[#f8f9fa] rounded-b-xl sm:rounded-b-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MODULE_TYPES.map((t) => {
              const selected = selectedType === t.type;
              return (
                <button
                  key={t.type}
                  onClick={() => {
                    setSelectedType(t.type);
                    addModule.mutate(t.type);
                  }}
                  disabled={addModule.isPending}
                  className={cn(
                    "flex flex-col items-start text-left p-5 rounded-2xl border border-gray-100 transition-all h-full",
                    selected ? "border-[#1a73e8] bg-blue-50/30" : "bg-white hover:border-[#dadce0] hover:shadow-sm",
                    addModule.isPending && !selected && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-gray-100 mb-3", selected ? "bg-[#1a73e8] border-[#1a73e8]" : "bg-white")}>
                    <t.Icon size={18} className={selected ? "text-white" : "text-gray-600"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[15px] font-bold mb-1", selected ? "text-[#1a73e8]" : "text-[#1f2937]")}>{t.label}</p>
                    <SafeHTML html={t.description} className="text-[11px] text-[#6b7280] leading-snug" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Day header (inline editing) ─────────────────────────────────────────────

function DayTabHeader({
  day,
  workspaceId,
  trainingId,
}: {
  day: TrainingDay;
  workspaceId: string;
  trainingId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(day.title);
  const [dateVal, setDateVal] = useState(
    day.date ? new Date(day.date).toISOString().split("T")[0] : "",
  );
  const [deliveryMode, setDeliveryMode] = useState<"in_person" | "online" | "hybrid" | "">(
    day.deliveryMode ?? ""
  );
  const updateDay = useUpdateDay(workspaceId, trainingId);
  const deleteDay = useDeleteDay(workspaceId, trainingId);
  const canEdit = useStudioCan("edit_agenda");

  const save = () => {
    updateDay.mutate({
      dayId: day.id,
      data: {
        title: title.trim() || day.title,
        date: dateVal ? new Date(dateVal).toISOString() : null,
        deliveryMode: deliveryMode ? deliveryMode : undefined,
      },
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-white rounded-xl border border-brand-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-brand-500 shrink-0" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="flex-1 px-2.5 py-1.5 border border-gray-100 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-gray-400 shrink-0" />
          <input
            type="date"
            value={dateVal}
            onChange={(e) => setDateVal(e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {dateVal && (
            <button onClick={() => setDateVal("")} className="text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={deliveryMode}
            onChange={(e) => setDeliveryMode(e.target.value as "in_person" | "online" | "hybrid" | "")}
            className="w-full px-2.5 py-1.5 border border-gray-100 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select Delivery Mode...</option>
            <option value="in_person">In-Person</option>
            <option value="online">Virtual / Online</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setTitle(day.title); setEditing(false); }}
            className="flex-1 py-1.5 border border-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={updateDay.isPending}
            className="flex-1 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 disabled:opacity-60"
          >
            {updateDay.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
          <CalendarDays size={16} className="text-brand-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{day.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {day.date ? (
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <Calendar size={10} />
                {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            ) : (
              <p className="text-[11px] text-gray-300">No date set</p>
            )}
            {day.deliveryMode && (
              <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full border border-gray-100">
                {day.deliveryMode === "in_person" ? "In-Person" : day.deliveryMode === "online" ? "Virtual" : "Hybrid"}
              </span>
            )}
          </div>
        </div>
      </div>
      {canEdit && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="Edit day"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete "${day.title}" and unassign its modules?`)) {
                deleteDay.mutate(day.id);
              }
            }}
            disabled={deleteDay.isPending}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
            title="Delete day"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Day module list (sortable) ───────────────────────────────────────────────

function DayModuleList({
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
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {modules.length === 0 && !adding && canEdit && (
        <div
          className="flex flex-col items-center justify-center py-12 bg-[#f8f9fa] rounded-lg border-2 border-dashed border-[#dadce0] cursor-pointer hover:border-[#1a73e8] hover:bg-[#f1f3f4] transition-all group"
          onClick={() => setAdding(true)}
        >
          <div className="w-10 h-10 rounded-xl bg-brand-100 group-hover:bg-brand-200 flex items-center justify-center mb-2.5 transition-colors">
            <Plus size={18} className="text-brand-600 group-hover:text-brand-700 transition-colors" />
          </div>
          <p className="text-sm font-semibold text-brand-700">
            Add first module for this day
          </p>
          <p className="text-xs text-brand-500/80 mt-1">Quiz, whiteboard, reflection, matrix, or sticky notes</p>
        </div>
      )}

      {modules.length === 0 && !canEdit && (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm font-medium text-gray-400">No modules for this day</p>
        </div>
      )}

      {!adding && modules.length > 0 && canEdit && (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-white border border-[#dadce0] text-[#1a73e8] font-medium text-sm hover:bg-[#f8f9fa] hover:border-[#1a73e8] transition-all group shadow-sm"
        >
          <Plus size={16} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          Add module
        </button>
      )}
    </div>
  );
}

// ─── Facilitator panel ───────────────────────────────────────────────────────

function FacilitatorPanel({ trainingId, workspaceId }: { trainingId: string; workspaceId: string }) {
  const { data: training } = useTraining(workspaceId, trainingId);
  const { data: members = [] } = useWorkspaceMembers(workspaceId);
  const assignFacilitator = useAssignFacilitator(workspaceId, trainingId);
  const inviteFacilitator = useInviteFacilitator(workspaceId, trainingId);
  const cancelInvitation = useCancelFacilitatorInvitation(workspaceId, trainingId);
  const resendInvitation = useResendFacilitatorInvitation(workspaceId, trainingId);
  const canManage = useStudioCan("assign_roles");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<TrainingRole>("full_editor");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [assignMode, setAssignMode] = useState<"member" | "email">("member");

  const allFacilitators: Array<{ userId: string; role: TrainingRole; user?: { name: string } }> =
    (training as { facilitators?: Array<{ userId: string; role: TrainingRole; user?: { name: string } }> })?.facilitators ?? [];

  // Creator is always the training owner — exclude from team list (they control the training by default)
  const facilitators = allFacilitators.filter((f) => f.userId !== training?.createdBy);

  const allInvitations = training?.pendingInvitations ?? [];
  const pendingInvitations = allInvitations.filter((inv) => (inv as { status?: string }).status === "pending");
  const resendableInvitations = allInvitations.filter((inv) => {
    const s = (inv as { status?: string }).status;
    return s === "cancelled" || s === "declined";
  });

  const unassigned = members.filter((m) => !facilitators.some((f) => f.userId === m.userId));
  const roleLabel = (role: TrainingRole) =>
    FACILITATOR_ROLES.find((r) => r.value === role)?.label ?? role;

  return (
    <div className="bg-white rounded-lg border border-[#dadce0] overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-900">Training Team</h2>
          {(facilitators.length + allInvitations.length) > 0 && (
            <span className="text-[10px] font-semibold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
              {facilitators.length + allInvitations.length}
            </span>
          )}
        </div>
        {canManage && (
          <button
            onClick={() => setShowAssign((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-800 font-semibold"
          >
            <UserPlus size={12} />
            Assign
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {facilitators.length === 0 && allInvitations.length === 0 && !showAssign && (
          <div className="py-5 text-center">
            <Users size={24} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-medium">No team members assigned</p>
            <p className="text-[10px] text-gray-300 mt-0.5">Add workspace members to help run this session</p>
          </div>
        )}

        {facilitators.map((f) => (
          <div key={f.userId} className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-700 shrink-0">
              {(f.user?.name ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <span className="text-sm text-gray-800 font-medium truncate flex-1 min-w-0">{f.user?.name ?? f.userId}</span>
            {canManage && f.userId !== training?.createdBy ? (
              <select
                value={f.role}
                onChange={(e) => assignFacilitator.mutate({ userId: f.userId, role: e.target.value as TrainingRole })}
                disabled={assignFacilitator.isPending}
                className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium shrink-0 border-none outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer disabled:opacity-50"
              >
                {FACILITATOR_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium shrink-0">
                {roleLabel(f.role)}
              </span>
            )}
          </div>
        ))}

        {pendingInvitations.map((inv) => (
          <div key={inv.id} className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-700 shrink-0">
              {inv.email.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-gray-600 font-medium truncate">{inv.email}</span>
              <span className="text-[9px] font-semibold text-amber-600 uppercase tracking-wide">Pending</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium whitespace-nowrap">
                {roleLabel(inv.role)}
              </span>
              {canManage && (
                <button
                  onClick={() => cancelInvitation.mutate(inv.id)}
                  disabled={cancelInvitation.isPending}
                  className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Cancel invitation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {resendableInvitations.map((inv) => {
          const status = (inv as { status?: string }).status as "cancelled" | "declined";
          return (
            <div key={inv.id} className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                {inv.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs text-gray-500 font-medium truncate">{inv.email}</span>
                <span className={`text-[9px] font-semibold uppercase tracking-wide ${status === "declined" ? "text-red-400" : "text-gray-400"}`}>
                  {status === "declined" ? "Declined" : "Cancelled"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium whitespace-nowrap">
                  {roleLabel(inv.role)}
                </span>
                {canManage && (
                  <button
                    onClick={() => resendInvitation.mutate(inv.id)}
                    disabled={resendInvitation.isPending}
                    className="text-gray-300 hover:text-brand-500 transition-colors disabled:opacity-50"
                    title="Resend invitation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.68" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {showAssign && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setAssignMode("member")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  assignMode === "member" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
                )}
              >
                Workspace Member
              </button>
              <button
                onClick={() => setAssignMode("email")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                  assignMode === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
                )}
              >
                Invite by Email
              </button>
            </div>

            {assignMode === "member" && (
              <div className="space-y-2.5">
                {unassigned.length > 0 ? (
                  <>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                    >
                      <option value="">Select member…</option>
                      {unassigned.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.name} ({m.user.email})
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as TrainingRole)}
                      className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                    >
                      {FACILITATOR_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label} — {r.description}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAssign(false)}
                        className="flex-1 py-2 text-[#1a73e8] bg-transparent rounded-full text-xs font-medium hover:bg-blue-50/50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!selectedUserId || assignFacilitator.isPending}
                        onClick={() => {
                          assignFacilitator.mutate(
                            { userId: selectedUserId, role: selectedRole },
                            { onSuccess: () => { setSelectedUserId(""); setShowAssign(false); } },
                          );
                        }}
                        className="flex-1 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-medium disabled:opacity-60 transition-colors shadow-sm"
                      >
                        {assignFacilitator.isPending ? "Assigning…" : "Assign"}
                      </button>
                    </div>
                    {assignFacilitator.isError && (
                      <p className="text-xs text-red-500 mt-2 text-center">
                        {(isAxiosError(assignFacilitator.error) ? assignFacilitator.error.response?.data?.error : null) || "Failed to assign facilitator."}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">No unassigned workspace members.</p>
                )}
              </div>
            )}

            {assignMode === "email" && (
              <div className="space-y-2.5">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as TrainingRole)}
                  className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                >
                  {FACILITATOR_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.description}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAssign(false)}
                    className="flex-1 py-2 text-[#1a73e8] bg-transparent rounded-full text-xs font-medium hover:bg-blue-50/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!inviteEmail || !inviteEmail.includes("@") || inviteFacilitator.isPending}
                    onClick={() => {
                      inviteFacilitator.mutate(
                        { email: inviteEmail, role: selectedRole },
                        { onSuccess: () => { setInviteEmail(""); setShowAssign(false); setSelectedRole("full_editor"); } },
                      );
                    }}
                    className="flex-1 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-medium disabled:opacity-60 transition-colors shadow-sm"
                  >
                    {inviteFacilitator.isPending ? "Inviting…" : "Invite"}
                  </button>
                </div>
                {inviteFacilitator.isError && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    {(isAxiosError(inviteFacilitator.error) ? inviteFacilitator.error.response?.data?.error : null) || "Failed to invite facilitator."}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Training info panel (editable) ─────────────────────────────────────────

const TRAINING_CATEGORIES: { value: string; label: string }[] = [
  { value: "atl", label: "ATL" },
  { value: "maker_space", label: "Maker Space" },
  { value: "ict_cal", label: "ICT/CAL" },
];

function TrainingInfoPanel({ trainingId, workspaceId }: { trainingId: string; workspaceId: string }) {
  const { data: training } = useTraining(workspaceId, trainingId);
  const updateTraining = useUpdateTraining(workspaceId, trainingId);
  const canEdit = useStudioCan("edit_agenda");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [labels, setLabels] = useState("");
  const [type, setType] = useState("in_person");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const startEditing = () => {
    if (!training) return;
    setTitle(training.title);
    setLabels(training.labels?.join(", ") ?? "");
    setType(training.type || "in_person");
    setDescription(training.description ?? "");
    setVenue(training.venue ?? "");
    setMeetingLink(training.meetingLink ?? "");
    setEditing(true);
  };

  const save = () => {
    updateTraining.mutate(
      {
        title: title.trim(),
        labels: labels ? labels.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        type,
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  if (!training) return null;

  return (
    <div className="bg-white rounded-lg border border-[#dadce0] overflow-hidden">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pencil size={14} className="text-gray-500" />
          <h2 className="text-sm font-bold text-gray-900">Training Info</h2>
        </div>
        {!editing && canEdit && (
          <button
            onClick={startEditing}
            className="flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-800 font-semibold"
          >
            <Pencil size={11} />
            Edit
          </button>
        )}
      </div>

      <div className="p-4">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Labels (comma separated)</label>
              <input
                value={labels}
                onChange={(e) => setLabels(e.target.value)}
                className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
              >
                <option value="in_person">In-Person</option>
                <option value="online">Online</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Description</label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Optional…"
                minHeight="120px"
              />
              <div className="flex justify-end mt-1">
                <span className={cn("text-[10px] font-medium", description.replace(new RegExp("<[^>]*>?", "gm"), '').length > 2000 ? "text-red-500" : "text-gray-500")}>
                  {description.replace(new RegExp("<[^>]*>?", "gm"), '').length} / 2000
                </span>
              </div>
            </div>
            {type === "in_person" || type === "hybrid" ? (
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Venue</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                />
              </div>
            ) : null}
            {type === "online" || type === "hybrid" ? (
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Meeting Link</label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full px-4 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-sm outline-none transition-colors"
                />
              </div>
            ) : null}
            {updateTraining.isError && (
              <p className="text-xs text-red-500">Failed to update.</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-1.5 text-[#1a73e8] bg-transparent rounded-full text-xs font-medium hover:bg-blue-50/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={updateTraining.isPending || !title.trim()}
                className="flex-1 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-xs font-medium disabled:opacity-60 transition-colors shadow-sm"
              >
                {updateTraining.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">{training.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {training.labels?.map((label: string, idx: number) => (
                <span key={idx} className="text-[10px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-100">
                  {label}
                </span>
              ))}
              {training.venue && (
                <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 flex items-center gap-1">
                  {training.venue}
                </span>
              )}
            </div>
            {training.description && (
              <SafeHTML html={training.description} className="text-xs text-gray-500 leading-relaxed prose-gray" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Session checklist panel ─────────────────────────────────────────────────

type ChecklistItem = { id: string; label: string; done: boolean };

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: "seed-days", label: "Organise into days", done: false },
  { id: "seed-module", label: "Add at least one module", done: false },
  { id: "seed-flow", label: "Create a full flow (2+ modules)", done: false },
];

function SessionChecklist({ workspaceId, trainingId }: { workspaceId: string; trainingId: string }) {
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
            className="flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-800 font-semibold"
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
                className="flex-1 px-3 py-2 bg-[#f1f3f4] border-b-2 border-transparent border-b-gray-400 focus:border-b-[#1a73e8] hover:bg-[#e8eaed] rounded-t-md text-xs outline-none transition-colors"
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
            className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 hover:text-brand-800"
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

// ─── Main StudioPage ─────────────────────────────────────────────────────────

export function StudioPage({ trainingId }: { trainingId: string }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const rawRole = useMyTrainingRole(workspaceId, trainingId);
  const myRole: TrainingRole | undefined =
    rawRole && rawRole !== "participant" ? rawRole : undefined;
  const { data: days = [], isLoading: daysLoading } = useDays(workspaceId, trainingId);
  const { data: allModules = [] } = useModules(workspaceId, trainingId);
  const { data: training } = useTraining(workspaceId, trainingId);
  const createDay = useCreateDay(workspaceId, trainingId);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("dayId") ?? "general";

  // Active tab: day id, or "general" for unassigned modules
  const [activeTab, setActiveTab] = useState<string | "general">(initialTab);
  const dayTabsRef = useRef<HTMLDivElement>(null);
  const scrollTabs = (dir: -1 | 1) =>
    dayTabsRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  const unassignedModules = allModules.filter((m) => m.dayId == null);
  const showGeneralTab = unassignedModules.length > 0;

  // Resolve active tab — if first day exists and no unassigned, default to first day
  const effectiveTab = (() => {
    if (activeTab === "general") return showGeneralTab ? "general" : (days[0]?.id ?? "general");
    if (days.find((d) => d.id === activeTab)) return activeTab;
    return days[0]?.id ?? (showGeneralTab ? "general" : "new");
  })();

  const activeDay = days.find((d) => d.id === effectiveTab) ?? null;
  const activeDayModules = activeDay
    ? (allModules.filter((m) => m.dayId === activeDay.id).sort((a, b) => a.position - b.position))
    : [];

  const handleAddDay = () => {
    const newDayNumber = days.length + 1;
    // Derive the new day's date from the training start so manually-added days
    // stay dated like the auto-generated ones. UTC-anchored to match the backend.
    let date: string | undefined;
    if (training?.startDate) {
      const start = new Date(training.startDate);
      if (!isNaN(start.getTime())) {
        date = new Date(start.getTime() + (newDayNumber - 1) * 86_400_000).toISOString();
      }
    }
    createDay.mutate(
      { dayNumber: newDayNumber, title: `Day ${newDayNumber}`, date },
      {
        onSuccess: (res: any) => {
          const newDay = res.data;
          if (newDay?.id) setActiveTab(newDay.id);
        },
      },
    );
  };

  const totalModules = allModules.length;
  const canEditAgenda = canDo(myRole, "edit_agenda");
  const isReadOnly = myRole !== undefined && !canDo(myRole, "edit_modules") && !canEditAgenda;

  // ── Onboarding empty state ──
  if (!daysLoading && days.length === 0 && unassignedModules.length === 0) {
    return (
      <StudioRoleContext.Provider value={myRole}>
      <div className="max-w-5xl mx-auto px-1 space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Training Studio</h1>
            <p className="text-sm text-gray-500 mt-0.5">Build and configure activities for your live session</p>
          </div>
          {(!myRole || canDo(myRole, "pause_room")) && (
            <Link
              href={`/trainings/${trainingId}/live`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm shadow-brand-200 w-full sm:w-auto shrink-0"
            >
              <Radio size={14} />
              Go Live
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {canEditAgenda ? (
              <div
                className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-100 cursor-pointer hover:border-brand-300 hover:bg-brand-50/20 transition-all group"
                onClick={handleAddDay}
              >
                <div className="w-14 h-14 rounded-xl bg-brand-50 group-hover:bg-brand-100 border border-brand-100 flex items-center justify-center mb-4 transition-colors">
                  <CalendarDays size={24} className="text-brand-500" />
                </div>
                <p className="text-base font-bold text-gray-800 group-hover:text-brand-700 transition-colors">
                  Start building your curriculum
                </p>
                <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">
                  Add Day 1 to get started. Each day holds its own set of activities.
                </p>
                <button
                  disabled={createDay.isPending}
                  className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors shadow-sm shadow-brand-200"
                >
                  <Plus size={15} />
                  {createDay.isPending ? "Adding…" : "Add Day 1"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                  <CalendarDays size={24} className="text-gray-300" />
                </div>
                <p className="text-base font-bold text-gray-700">No curriculum yet</p>
                <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">
                  This training has no days or modules set up yet.
                </p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <TrainingInfoPanel trainingId={trainingId} workspaceId={workspaceId} />
            <SessionChecklist trainingId={trainingId} workspaceId={workspaceId} />
          </div>
        </div>
      </div>
      </StudioRoleContext.Provider>
    );
  }

  return (
    <StudioRoleContext.Provider value={myRole}>
    <div className="max-w-5xl mx-auto px-1 space-y-5 pb-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Training Studio</h1>
          <p className="text-sm text-gray-500 mt-0.5">Build and configure activities for your live session</p>
        </div>
        {(!myRole || canDo(myRole, "pause_room")) && (
          <Link
            href={`/trainings/${trainingId}/live`}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full text-sm font-medium transition-colors shadow-sm w-full sm:w-auto shrink-0"
          >
            <Radio size={16} />
            Go Live
          </Link>
        )}
      </div>

      {isReadOnly && (
        <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
          <Lock size={15} className="text-gray-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Read-only access</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Your role lets you view this training and participate in chat, but not edit content.
            </p>
          </div>
        </div>
      )}

      {/* Day tabs row */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => scrollTabs(-1)}
          aria-label="Scroll days left"
          className="shrink-0 p-1.5 rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-brand-600 hover:border-brand-200 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
      <div
        ref={dayTabsRef}
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
        onWheel={(e) => {
          if (e.deltaY === 0) return;
          e.currentTarget.scrollLeft += e.deltaY;
        }}
      >
        {days.map((day) => {
          const dayMods = allModules.filter((m) => m.dayId === day.id);
          const isActive = effectiveTab === day.id;
          return (
            <button
              key={day.id}
              onClick={() => setActiveTab(day.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all border-none",
                isActive
                  ? "bg-[#e8f0fe] text-[#1a73e8]"
                  : "bg-white text-gray-600 hover:bg-[#f1f3f4]",
              )}
            >
              <CalendarDays size={16} />
              <span>{day.title}</span>
              {dayMods.length > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-blue-200/50 text-[#1a73e8]" : "bg-gray-100 text-gray-500",
                  )}
                >
                  {dayMods.length}
                </span>
              )}
            </button>
          );
        })}

        {/* General tab for unassigned modules */}
        {showGeneralTab && (
          <button
            onClick={() => setActiveTab("general")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shrink-0 transition-all border-none",
              effectiveTab === "general"
                ? "bg-amber-100 text-amber-800"
                : "bg-white text-amber-700 hover:bg-amber-50",
            )}
          >
            <AlertTriangle size={16} />
            <span>Unassigned</span>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                effectiveTab === "general" ? "bg-amber-200/50 text-amber-800" : "bg-amber-100 text-amber-600",
              )}
            >
              {unassignedModules.length}
            </span>
          </button>
        )}

        {/* Add day button */}
        {canEditAgenda && (
          <button
            onClick={handleAddDay}
            disabled={createDay.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium shrink-0 border-none bg-white text-gray-500 hover:bg-[#f1f3f4] hover:text-gray-800 transition-all disabled:opacity-50"
          >
            <Plus size={16} />
            {createDay.isPending ? "Adding…" : "Add Day"}
          </button>
        )}
      </div>
        <button
          type="button"
          onClick={() => scrollTabs(1)}
          aria-label="Scroll days right"
          className="shrink-0 p-1.5 rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-brand-600 hover:border-brand-200 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: content area ── */}
        <div className="lg:col-span-2 space-y-4">
          {effectiveTab === "general" ? (
            <>
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Modules not assigned to a day</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    These modules were created before day organisation was set up. Assign them to a day or they will appear as general content.
                  </p>
                </div>
              </div>
              <DayModuleList
                modules={unassignedModules.sort((a, b) => a.position - b.position)}
                workspaceId={workspaceId}
                trainingId={trainingId}
                dayId={null}
              />
            </>
          ) : activeDay ? (
            <>
              <DayTabHeader day={activeDay} workspaceId={workspaceId} trainingId={trainingId} />
              <DayModuleList
                modules={activeDayModules}
                workspaceId={workspaceId}
                trainingId={trainingId}
                dayId={activeDay.id}
              />
            </>
          ) : null}
        </div>

        {/* ── Right: sidebar ── */}
        <div className="space-y-4">
          <TrainingInfoPanel trainingId={trainingId} workspaceId={workspaceId} />
          <SessionChecklist trainingId={trainingId} workspaceId={workspaceId} />
          <FacilitatorPanel trainingId={trainingId} workspaceId={workspaceId} />
        </div>
      </div>
    </div>
    </StudioRoleContext.Provider>
  );
}
