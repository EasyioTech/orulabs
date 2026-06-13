"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerTimer({ module, trainingId }: Props) {
  const socket = useSocket();
  const duration = module.config.durationSeconds ?? 300;
  const label = module.config.timerLabel ?? "Time remaining";
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const broadcast = useCallback(
    (r: number, isRunning: boolean) => {
      socket?.emit("timer:sync" as any, { trainingId, moduleId: module.id, remaining: r, running: isRunning, duration });
    },
    [socket, trainingId, module.id, duration],
  );

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            broadcast(0, false);
            return 0;
          }
          // Broadcast every 5 seconds to keep participants in sync without flooding
          if (next % 5 === 0) broadcast(next, true);
          return next;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStart = () => {
    setRunning(true);
    broadcast(remaining, true);
  };

  const handlePause = () => {
    setRunning(false);
    broadcast(remaining, false);
  };

  const handleReset = () => {
    setRunning(false);
    setRemaining(duration);
    broadcast(duration, false);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = duration > 0 ? (remaining / duration) * 100 : 0;
  const isFinished = remaining === 0;

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">{module.title} (Trainer View)</h2>
      <p className="text-sm text-gray-500">{label}</p>

      <div className="relative w-56 h-56">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="6" fill="none" />
          <circle
            cx="50" cy="50" r="45"
            stroke={isFinished ? "#ef4444" : "#6366f1"}
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-5xl font-mono font-bold ${isFinished ? "text-red-500" : "text-gray-900"}`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        </div>
      </div>

      {isFinished && <p className="text-red-500 font-semibold text-lg animate-pulse">Time's up!</p>}

      <div className="flex gap-3">
        <button
          onClick={running ? handlePause : handleStart}
          className="px-8 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors text-sm"
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={handleReset}
          className="px-8 py-3 border border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
        >
          Reset
        </button>
      </div>

      <p className="text-xs text-gray-400">Timer is synced to all participants in real-time.</p>
    </div>
  );
}
