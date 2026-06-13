"use client";

import { useEffect, useState } from "react";
import { useLiveSessionStore } from "@/store/liveSession";
import { useSocket } from "@/hooks/useSocket";
import { Pause, Play, RotateCcw, Timer, Pencil, Check, X } from "lucide-react";
import { cn } from "@oruclass/utils";

// canControl gates the pause/resume/reset buttons. It must reflect the
// pause_room permission (lead_trainer / full_editor only), NOT the binary
// trainer flag — partial_editor / facilitation_support are "trainers" but the
// server rejects their stopwatch:action, so showing them the buttons is a lie.
export function ModuleStopwatch({ canControl = false }: { canControl?: boolean }) {
  const stopwatch = useLiveSessionStore((s) => s.stopwatch);
  const activeModule = useLiveSessionStore((s) => s.activeModule);
  const trainingId = useLiveSessionStore((s) => s.trainingId);
  const socket = useSocket();
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editM, setEditM] = useState("");
  const [editS, setEditS] = useState("");

  const timeLimit = activeModule?.config?.timeLimitSeconds ?? 0;
  const isCountdown = timeLimit > 0;

  useEffect(() => {
    if (!stopwatch) {
      setDisplaySeconds(0);
      return;
    }

    if (!stopwatch.isRunning) {
      setDisplaySeconds(stopwatch.accumulatedSeconds);
      return;
    }

    const startTimestamp = new Date(stopwatch.lastStartedAt).getTime();
    const update = () => {
      const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
      setDisplaySeconds(stopwatch.accumulatedSeconds + elapsed);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [stopwatch]);

  if (!stopwatch) return null;

  const handleAction = (action: "pause" | "resume" | "reset") => {
    if (!trainingId || !socket) return;
    socket.emit("stopwatch:action", { trainingId, moduleId: stopwatch.moduleId, action });
  };

  const openEdit = () => {
    setEditM(timeLimit > 0 ? String(Math.floor(timeLimit / 60)) : "");
    setEditS(timeLimit > 0 ? String(timeLimit % 60) : "");
    setEditing(true);
  };

  const saveEdit = () => {
    if (!trainingId || !socket) return;
    const m = Math.max(0, parseInt(editM.replace(/\D/g, ""), 10) || 0);
    const s = Math.min(59, Math.max(0, parseInt(editS.replace(/\D/g, ""), 10) || 0));
    socket.emit("module:setTimeLimit", {
      trainingId,
      moduleId: stopwatch.moduleId,
      timeLimitSeconds: m * 60 + s,
    });
    setEditing(false);
  };

  const formatTime = (totalSeconds: number) => {
    const timeToFormat = isCountdown ? Math.max(0, timeLimit - totalSeconds) : totalSeconds;
    const m = Math.floor(timeToFormat / 60);
    const s = timeToFormat % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const remaining = isCountdown ? Math.max(0, timeLimit - displaySeconds) : null;
  const timeUp = isCountdown && remaining === 0;

  return (
    <div className={cn(
      "flex flex-col items-center gap-3 backdrop-blur shadow-lg px-4 py-3 sm:px-6 sm:py-4 rounded-xl absolute top-4 right-4 z-50 transition-colors duration-300",
      "max-w-xs sm:max-w-md",
      timeUp ? "bg-red-50/95 border border-red-300 text-red-600" : "bg-white/90 border border-brand-200 text-brand-900"
    )}>
      <div className="flex items-center gap-2 w-full">
        <Timer className={cn(
          "shrink-0 transition-all",
          timeUp ? "text-red-500" : "text-brand-500",
          "w-5 h-5 sm:w-6 sm:h-6"
        )} />

        {editing ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              value={editM}
              onChange={(e) => setEditM(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 max-w-[60px] px-2 py-1.5 border border-brand-200 rounded-lg text-center text-base sm:text-lg font-mono font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="00"
            />
            <span className="text-brand-400 font-bold text-lg">:</span>
            <input
              type="text"
              inputMode="numeric"
              value={editS}
              onChange={(e) => setEditS(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
              className="flex-1 max-w-[60px] px-2 py-1.5 border border-brand-200 rounded-lg text-center text-base sm:text-lg font-mono font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="00"
            />
            <button onClick={saveEdit} className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg transition-colors" title="Save time limit">
              <Check className="w-5 h-5" />
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors" title="Cancel">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <span className="font-mono font-bold text-xl sm:text-2xl tracking-wider flex-1 text-center">
            {timeUp ? "Time's up!" : formatTime(displaySeconds)}
          </span>
        )}
      </div>

      {canControl && !editing && (
        <div className={cn(
          "flex items-center gap-2 w-full pt-2 border-t",
          timeUp ? "border-red-200" : "border-brand-200/50"
        )}>
          <button
            onClick={openEdit}
            className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-brand-50 text-brand-600 rounded-lg transition-colors text-sm font-medium"
            title="Set time limit"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Set Time</span>
          </button>
          {stopwatch.isRunning ? (
            <button
              onClick={() => handleAction("pause")}
              className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-brand-50 text-brand-600 rounded-lg transition-colors text-sm font-medium"
              title="Pause Stopwatch"
            >
              <Pause className="w-4 h-4" />
              <span className="hidden sm:inline">Pause</span>
            </button>
          ) : (
            <button
              onClick={() => handleAction("resume")}
              className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-brand-50 text-brand-600 rounded-lg transition-colors text-sm font-medium"
              title="Resume Stopwatch"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Resume</span>
            </button>
          )}
          <button
            onClick={() => handleAction("reset")}
            className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors text-sm font-medium"
            title="Reset Stopwatch"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      )}
    </div>
  );
}
