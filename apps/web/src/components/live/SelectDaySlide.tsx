"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarDays, ChevronRight, Layers } from "lucide-react";
import type { TrainingDay } from "@oruclass/types";
import { cn } from "@oruclass/utils";

interface Props {
  days: TrainingDay[];
  moduleCountForDay: (dayId: string | null) => number;
}

/**
 * Trainer-only gate shown before opening a multi-day training for joining.
 * Picking a day sets ?dayId=<id> in the URL — ControlPanel and AgendaPane
 * read that param and only surface modules assigned to the chosen day.
 * "All days" sets ?dayId=all to bypass the filter (run the whole training).
 */
export function SelectDaySlide({ days, moduleCountForDay }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = (dayId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("dayId", dayId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-7 px-4 sm:px-8 py-8 select-none">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center border-4 border-brand-100"
      >
        <CalendarDays className="w-10 h-10 text-brand-500" />
      </motion.div>

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-1.5">Which day are you running?</h3>
        <p className="text-[14px] text-gray-500 max-w-md mx-auto">
          Pick a day to start — only that day&apos;s modules will appear in the session.
        </p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2">
        {sorted.map((d) => {
          const count = moduleCountForDay(d.id);
          return (
            <button
              key={d.id}
              onClick={() => select(d.id)}
              className="group flex flex-col gap-2.5 p-4 rounded-xl bg-white border border-gray-100 hover:border-brand-300 hover:shadow-md active:scale-[.98] transition-all text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex flex-col items-center justify-center leading-none">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-brand-400">Day</span>
                  <span className="text-[16px] font-bold text-brand-700 tabular-nums">{d.dayNumber}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-500 transition-all flex-shrink-0 mt-0.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 line-clamp-2">{d.title}</p>
                <p className="text-[12px] text-gray-400 font-medium mt-1">
                  {count} {count === 1 ? "module" : "modules"}
                </p>
                {d.deliveryMode && (
                  <p className="text-[11px] text-gray-500 mt-1.5 pt-1.5 border-t border-gray-100">
                    {d.deliveryMode === "in_person" ? "📍 In-Person" : d.deliveryMode === "online" ? "💻 Virtual" : "🔀 Hybrid"}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {/* All days — run the whole training without day filtering */}
        <button
          onClick={() => select("all")}
          className={cn(
            "group flex flex-col gap-2.5 p-4 rounded-xl bg-gray-50 border border-gray-100",
            "hover:bg-gray-100 hover:border-gray-200 hover:shadow-md active:scale-[.98] transition-all text-left",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white border border-gray-300 flex items-center justify-center">
              <Layers size={20} className="text-gray-500" />
            </div>
            <ChevronRight size={18} className="text-gray-400 transition-all flex-shrink-0 mt-0.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-gray-800">All days</p>
            <p className="text-[12px] text-gray-500 font-medium mt-1">Run every module</p>
          </div>
        </button>
      </div>
    </div>
  );
}
