"use client";

import { useStopwatchStore } from "@/store/stopwatch";
import { Clock } from "lucide-react";
import { cn } from "@oruclass/utils";

export function StopwatchDisplay() {
  const { elapsedSeconds, isRunning } = useStopwatchStore();

  if (elapsedSeconds === 0 && !isRunning) return null;

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono border transition-colors",
      isRunning 
        ? "bg-brand-50 text-brand-700 border-brand-200" 
        : "bg-gray-100 text-gray-500 border-gray-100"
    )}>
      <Clock className={cn("w-3.5 h-3.5", isRunning && "animate-pulse")} />
      <span>
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
