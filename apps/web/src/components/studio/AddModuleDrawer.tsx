"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { cn } from "@oruclass/utils";
import { SafeHTML } from "@/components/ui/SafeHTML";
import { MODULE_TYPES, getModuleDef } from "./moduleTypes";

export function AddModuleDrawer({
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
        className="bg-white w-full sm:max-w-4xl rounded-t-xl sm:rounded-lg border-t sm:border border-gray-100 shadow-sm max-h-[88vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
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
                    "flex flex-col items-start text-left p-5 rounded-lg border border-gray-100 transition-all h-full",
                    selected ? "border-[#1a73e8] bg-blue-50/30" : "bg-white hover:border-[#dadce0] hover:shadow-sm",
                    addModule.isPending && !selected && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className={cn("w-10 h-10 rounded flex items-center justify-center shrink-0 border border-gray-100 mb-3", selected ? "bg-[#1a73e8] border-[#1a73e8]" : "bg-white")}>
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
            className="w-full py-2.5 border border-gray-100 text-gray-700 rounded text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
