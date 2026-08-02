"use client";

import { useState } from "react";
import type { TrainingDay } from "@oruclass/types";
import { CalendarDays, Calendar, Pencil, Trash2, X } from "lucide-react";
import { useUpdateDay, useDeleteDay } from "@/hooks/useDays";
import { useStudioCan } from "./studioRole";

export function DayTabHeader({
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
      <div className="bg-white rounded border border-[#d2e3fc] shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-[#1a73e8] shrink-0" />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="flex-1 px-2.5 py-1.5 border border-gray-100 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-gray-400 shrink-0" />
          <input
            type="date"
            value={dateVal}
            onChange={(e) => setDateVal(e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
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
            className="w-full px-2.5 py-1.5 border border-gray-100 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
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
            className="flex-1 py-1.5 border border-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={updateDay.isPending}
            className="flex-1 py-1.5 bg-[#1a73e8] text-white rounded text-xs font-semibold hover:bg-[#1557b0] disabled:opacity-60"
          >
            {updateDay.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-white rounded border border-gray-100 shadow-sm px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded bg-[#e8f0fe] border border-brand-100 flex items-center justify-center shrink-0">
          <CalendarDays size={16} className="text-[#1a73e8]" />
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
            className="p-1.5 text-gray-400 hover:text-[#1a73e8] hover:bg-[#e8f0fe] rounded-lg transition-colors"
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
