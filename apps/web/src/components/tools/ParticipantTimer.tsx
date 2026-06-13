"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { TrainingModule } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantTimer({ module }: Props) {
  const socket = useSocket();
  const [remaining, setRemaining] = useState(module.config.durationSeconds ?? 300);
  const [running, setRunning] = useState(false);
  const [duration, setDuration] = useState(module.config.durationSeconds ?? 300);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const label = module.config.timerLabel ?? "Time remaining";

  // Listen for trainer timer:sync events
  useEffect(() => {
    if (!socket) return;
    const handler = (data: { moduleId: string; remaining: number; running: boolean; duration: number }) => {
      if (data.moduleId !== module.id) return;
      setRemaining(data.remaining);
      setRunning(data.running);
      setDuration(data.duration);
    };
    socket.on("timer:sync" as any, handler);
    return () => { socket.off("timer:sync" as any, handler); };
  }, [socket, module.id]);

  // Local countdown when running
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = duration > 0 ? (remaining / duration) * 100 : 0;
  const isFinished = remaining === 0 && duration > 0;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 text-center">{module.title}</h2>
      <p className="text-xs sm:text-sm text-gray-500">{label}</p>

      <div className="relative w-36 h-36 sm:w-48 sm:h-48">
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
          <span className={`text-3xl sm:text-4xl font-mono font-bold ${isFinished ? "text-red-500" : "text-gray-900"}`}>
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
        </div>
      </div>

      {isFinished ? (
        <p className="text-red-500 font-semibold text-base sm:text-lg animate-pulse">Time's up!</p>
      ) : !running && remaining === duration ? (
        <p className="text-sm text-gray-400">Waiting for trainer to start the timer…</p>
      ) : null}
    </div>
  );
}
