"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useWorkspaceStore } from "@/store/workspace";
import { useTrainings } from "@/hooks/useTrainings";
import type { Training } from "@oruclass/types";
import { cn } from "@oruclass/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ExternalLink,
  X,
} from "lucide-react";
import { SafeHTML } from "@/components/ui/SafeHTML";

const DAYS_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_COLORS: Record<string, string> = {
  live: "bg-green-500",
  connecting: "bg-blue-500",
  paused: "bg-amber-500",
  completed: "bg-gray-400",
  draft: "bg-brand-500",
};

const STATUS_LABEL: Record<string, string> = {
  live: "Live",
  connecting: "Connecting",
  paused: "Paused",
  completed: "Completed",
  draft: "Draft",
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const DATE_FMT: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };

/** "Mon, Jun 8" or "Mon, Jun 8 → Wed, Jun 10" when the training spans multiple days. */
function formatRange(startStr: string, endStr?: string) {
  const start = new Date(startStr);
  const startLabel = start.toLocaleDateString(undefined, DATE_FMT);
  if (!endStr) return startLabel;
  const end = new Date(endStr);
  if (isSameDay(start, end)) return startLabel;
  return `${startLabel} → ${end.toLocaleDateString(undefined, DATE_FMT)}`;
}

export function CalendarView() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const { data: trainings = [], isLoading } = useTrainings(workspaceId);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Training | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, Training[]>();
    trainings.forEach((t) => {
      if (!t.startDate) return;
      // Mark every day the training spans (startDate → endDate inclusive) as occupied.
      const start = new Date(t.startDate);
      const end = t.endDate ? new Date(t.endDate) : start;
      const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      // Guard against an end date earlier than the start.
      if (last < cursor) last.setTime(cursor.getTime());
      while (cursor <= last) {
        const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
        const list = map.get(key) ?? [];
        list.push(t);
        map.set(key, list);
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return map;
  }, [trainings]);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const totalCells = Math.ceil((firstDay + totalDays) / 7) * 7;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  // Handle swipe logic
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextMonth();
    }
    if (isRightSwipe) {
      prevMonth();
    }
  };

  const unscheduled = trainings.filter((t) => !t.startDate);

  // Events for selected day (mobile day-tap)
  const selectedDayEvents = selectedDay ? byDay.get(selectedDay) ?? [] : [];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Calendar</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Training schedule overview</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs sm:text-sm font-semibold text-gray-900 px-1 sm:px-2 min-w-[100px] sm:min-w-[140px] text-center">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <ChevronRight size={16} />
          </button>
          <button
            onClick={goToday}
            className="ml-1 sm:ml-2 text-xs font-medium text-brand-600 hover:text-brand-700 border border-brand-200 hover:border-brand-300 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-none sm:flex-1 min-h-0 flex-col lg:flex-row">
        {/* Calendar grid */}
        <div 
          className="sm:flex-1 min-w-0 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col sm:min-h-[320px] touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndHandler}
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS_FULL.map((d, i) => (
              <div key={d + i} className="py-2 sm:py-2.5 text-center text-[10px] sm:text-xs font-semibold text-gray-400">
                <span className="hidden sm:inline">{d}</span>
                <span className="sm:hidden">{DAYS_SHORT[i]}</span>
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - firstDay + 1;
              const isCurrentMonth = dayNum >= 1 && dayNum <= totalDays;
              const cellDate = new Date(viewYear, viewMonth, dayNum);
              const isToday = isCurrentMonth && isSameDay(cellDate, today);
              const key = `${viewYear}-${viewMonth}-${dayNum}`;
              const events = byDay.get(key) ?? [];
              const isSelectedDay = selectedDay === key;

              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    if (!isCurrentMonth) return;
                    if (events.length > 0) {
                      setSelectedDay(isSelectedDay ? null : key);
                      if (events.length === 1) setSelected(events[0]);
                      else setSelected(null);
                    }
                  }}
                  className={cn(
                    "border-b border-r border-gray-100 p-1 sm:p-1.5 min-h-[40px] sm:min-h-[80px] overflow-hidden text-left transition-colors min-w-0",
                    !isCurrentMonth && "bg-gray-50/50",
                    isCurrentMonth && events.length > 0 && "cursor-pointer hover:bg-brand-50/40",
                    isSelectedDay && "bg-brand-50 ring-1 ring-brand-200",
                  )}
                >
                  {isCurrentMonth && (
                    <>
                      <div className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-semibold mb-0.5 sm:mb-1",
                        isToday ? "bg-brand-600 text-white" : "text-gray-700",
                      )}>
                        {dayNum}
                      </div>
                      {/* Mobile: just dots */}
                      <div className="flex gap-0.5 sm:hidden flex-wrap">
                        {events.slice(0, 4).map((t) => (
                          <span key={t.id} className={cn("w-1.5 h-1.5 rounded-full", STATUS_COLORS[t.sessionStatus] ?? "bg-gray-400")} />
                        ))}
                      </div>
                      {/* Desktop: event pills */}
                      <div className="hidden sm:block space-y-0.5">
                        {events.slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            onClick={(e) => { e.stopPropagation(); setSelected(t); }}
                            className="w-full text-left text-[10px] font-medium rounded px-1.5 py-0.5 flex items-center gap-1 hover:opacity-80 transition-opacity bg-brand-50 text-brand-700 border border-brand-100 cursor-pointer min-w-0"
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_COLORS[t.sessionStatus] ?? "bg-gray-400")} />
                            <span className="truncate flex-1">{t.title}</span>
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="text-[10px] text-gray-400 pl-1">+{events.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex w-72 shrink-0 flex-col gap-3">
          <TrainingDetail training={selected} onClose={() => setSelected(null)} />
          <UnscheduledList trainings={unscheduled} />
          {isLoading && <Spinner />}
        </div>
      </div>

      {/* Mobile: selected day events */}
      {selectedDay && selectedDayEvents.length > 0 && (
        <div className="lg:hidden bg-white rounded-xl border border-gray-100 p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-gray-900">
              {new Date(viewYear, viewMonth, parseInt(selectedDay.split("-")[2])).toLocaleDateString(undefined, {
                weekday: "short", month: "short", day: "numeric",
              })}
            </h3>
            <button onClick={() => { setSelectedDay(null); setSelected(null); }} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={14} />
            </button>
          </div>
          {selectedDayEvents.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelected(selected?.id === t.id ? null : t)}
              className={cn(
                "p-3 rounded-xl border transition-colors cursor-pointer",
                selected?.id === t.id ? "border-brand-300 bg-brand-50" : "border-gray-100 hover:border-gray-100",
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full shrink-0", STATUS_COLORS[t.sessionStatus] ?? "bg-gray-400")} />
                <span className="text-sm font-medium text-gray-900 truncate flex-1">{t.title}</span>
                <span className="text-[10px] font-medium text-gray-500 capitalize">{STATUS_LABEL[t.sessionStatus] ?? t.sessionStatus}</span>
              </div>
              {selected?.id === t.id && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                  {t.startDate && (
                    <p className="text-xs text-gray-500">
                      {formatRange(t.startDate, t.endDate)}
                    </p>
                  )}
                  {t.description && <SafeHTML html={t.description} className="text-xs text-gray-500 line-clamp-2" />}
                  <Link
                    href={`/trainings/${t.id}/studio`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Open Studio <ExternalLink size={11} />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mobile: selected training detail (when tapped from desktop pills — fallback) */}
      {selected && !selectedDay && (
        <div className="lg:hidden">
          <TrainingDetail training={selected} onClose={() => setSelected(null)} />
        </div>
      )}

      {/* Mobile: unscheduled */}
      {unscheduled.length > 0 && (
        <div className="lg:hidden">
          <UnscheduledList trainings={unscheduled} />
        </div>
      )}

      {isLoading && (
        <div className="lg:hidden">
          <Spinner />
        </div>
      )}
    </div>
  );
}

function TrainingDetail({ training, onClose }: { training: Training | null; onClose: () => void }) {
  if (!training) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{training.title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-0.5 shrink-0">
          <X size={14} />
        </button>
      </div>
      {training.startDate && (
        <p className="text-xs text-gray-500">
          {formatRange(training.startDate, training.endDate)}
        </p>
      )}
      <div className="flex items-center gap-1.5">
        <span className={cn("w-2 h-2 rounded-full", STATUS_COLORS[training.sessionStatus] ?? "bg-gray-400")} />
        <span className="text-xs font-medium text-gray-700 capitalize">{STATUS_LABEL[training.sessionStatus] ?? training.sessionStatus}</span>
      </div>
      {training.description && (
        <SafeHTML html={training.description} className="text-xs text-gray-500 line-clamp-3" />
      )}
      <Link
        href={`/trainings/${training.id}/studio`}
        className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        Open Studio <ExternalLink size={11} />
      </Link>
    </div>
  );
}

function UnscheduledList({ trainings }: { trainings: Training[] }) {
  if (trainings.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex-1 overflow-hidden flex flex-col">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Unscheduled</h3>
      <div className="space-y-1.5 overflow-y-auto flex-1">
        {trainings.map((t) => (
          <Link
            key={t.id}
            href={`/trainings/${t.id}/studio`}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand-600 hover:bg-brand-50 rounded-lg px-2 py-1.5 transition-colors group"
          >
            <Calendar size={13} className="text-gray-400 group-hover:text-brand-500 shrink-0" />
            <span className="truncate">{t.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-brand-500 border-t-transparent" />
    </div>
  );
}
