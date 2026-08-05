"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useModules } from "@/hooks/useModules";
import { useDays, useCreateDay } from "@/hooks/useDays";
import { useWorkspaceStore } from "@/store/workspace";
import { useTraining, useMyTrainingRole } from "@/hooks/useTrainings";
import { canDo } from "@/lib/permissions";
import type { TrainingRole } from "@oruclass/types";
import { cn } from "@oruclass/utils";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Radio,
  CalendarDays,
  AlertTriangle,
  Lock,
  Play,
} from "lucide-react";
import { StudioRoleContext } from "./studioRole";
import { DayTabHeader } from "./DayTabHeader";
import { DayModuleList } from "./DayModuleList";
import { FacilitatorPanel } from "./FacilitatorPanel";
import { TrainingInfoPanel } from "./TrainingInfoPanel";
import { SessionChecklist } from "./SessionChecklist";

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
        onSuccess: (res) => {
          const newDay = res.data;
          if (newDay?.id) setActiveTab(newDay.id);
        },
      },
    );
  };

  const canEditAgenda = canDo(myRole, "edit_agenda");
  const isReadOnly = myRole !== undefined && !canDo(myRole, "edit_modules") && !canEditAgenda;

  // ── Onboarding empty state ──
  if (!daysLoading && days.length === 0 && unassignedModules.length === 0) {
    return (
      <StudioRoleContext.Provider value={myRole}>
      <div className="min-h-screen bg-[#f8f9fa] pt-4"><div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Training Studio</h1>
            <p className="text-sm text-gray-500 mt-0.5">Build and configure activities for your live session</p>
          </div>
          {["live", "connecting", "paused"].includes(training?.sessionStatus ?? "") ? (
            <Link
              href={`/trainings/${trainingId}/live`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold transition-colors shadow-sm shadow-green-200 w-full sm:w-auto shrink-0"
            >
              <Play size={14} />
              Join Session
            </Link>
          ) : (!myRole || canDo(myRole, "pause_room")) ? (
            <Link
              href={`/trainings/${trainingId}/live`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded text-sm font-semibold transition-colors shadow-sm shadow-brand-200 w-full sm:w-auto shrink-0"
            >
              <Radio size={14} />
              Go Live
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {canEditAgenda ? (
              <div
                className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-[#dadce0] cursor-pointer hover:border-brand-300 hover:bg-[#e8f0fe]/20 transition-all group"
                onClick={handleAddDay}
              >
                <div className="w-14 h-14 rounded bg-[#e8f0fe] group-hover:bg-[#d2e3fc] border border-brand-100 flex items-center justify-center mb-4 transition-colors">
                  <CalendarDays size={24} className="text-[#1a73e8]" />
                </div>
                <p className="text-base font-bold text-gray-800 group-hover:text-[#1557b0] transition-colors">
                  Start building your curriculum
                </p>
                <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">
                  Add Day 1 to get started. Each day holds its own set of activities.
                </p>
                <button
                  disabled={createDay.isPending}
                  className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-[#1a73e8] text-white rounded text-sm font-semibold hover:bg-[#1557b0] disabled:opacity-60 transition-colors shadow-sm shadow-brand-200"
                >
                  <Plus size={15} />
                  {createDay.isPending ? "Adding…" : "Add Day 1"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-[#dadce0]">
                <div className="w-14 h-14 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
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
      </div></div>
      </StudioRoleContext.Provider>
    );
  }

  return (
    <StudioRoleContext.Provider value={myRole}>
    <div className="min-h-screen bg-[#f8f9fa] pt-4"><div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-5 pb-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Training Studio</h1>
          <p className="text-sm text-gray-500 mt-0.5">Build and configure activities for your live session</p>
        </div>
        {["live", "connecting", "paused"].includes(training?.sessionStatus ?? "") ? (
          <Link
            href={`/trainings/${trainingId}/live`}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm w-full sm:w-auto shrink-0"
          >
            <Play size={16} />
            Join Session
          </Link>
        ) : (!myRole || canDo(myRole, "pause_room")) ? (
          <Link
            href={`/trainings/${trainingId}/live`}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md text-sm font-medium transition-colors shadow-sm w-full sm:w-auto shrink-0"
          >
            <Radio size={16} />
            Go Live
          </Link>
        ) : null}
      </div>

      {isReadOnly && (
        <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-100 rounded px-4 py-3">
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
          className="shrink-0 p-1.5 rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-[#1a73e8] hover:border-[#d2e3fc] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
      <div
        ref={dayTabsRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-none border-b border-[#dadce0] w-full"
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
                "flex items-center gap-2 px-4 py-3 text-sm font-medium shrink-0 transition-all border-b-2",
                isActive
                  ? "border-[#1a73e8] text-[#1a73e8] bg-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50 bg-transparent",
              )}
            >
              <CalendarDays size={16} />
              <span>{day.title}</span>
              {dayMods.length > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded",
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
              "flex items-center gap-2 px-4 py-3 text-sm font-medium shrink-0 transition-all border-b-2",
              effectiveTab === "general"
                ? "border-amber-500 text-amber-700 bg-transparent"
                : "border-transparent text-gray-600 hover:text-amber-700 hover:bg-amber-50 bg-transparent",
            )}
          >
            <AlertTriangle size={16} />
            <span>Unassigned</span>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded",
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
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium shrink-0 border-b-2 border-transparent bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
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
          className="shrink-0 p-1.5 rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-[#1a73e8] hover:border-[#d2e3fc] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: content area ── */}
        <div className="lg:col-span-2 space-y-4">
          {effectiveTab === "general" ? (
            <>
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded px-4 py-3">
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
    </div></div>
    </StudioRoleContext.Provider>
  );
}
