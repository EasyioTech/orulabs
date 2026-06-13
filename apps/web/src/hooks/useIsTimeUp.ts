"use client";

import { useEffect, useState } from "react";
import { useLiveSessionStore } from "@/store/liveSession";

export function useIsTimeUp(): boolean {
  const stopwatch = useLiveSessionStore((s) => s.stopwatch);
  const activeModule = useLiveSessionStore((s) => s.activeModule);
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    if (!stopwatch || !activeModule) {
      setTimeUp(false);
      return;
    }

    const timeLimit = activeModule.config?.timeLimitSeconds ?? 0;
    if (timeLimit <= 0) {
      setTimeUp(false);
      return;
    }

    const check = () => {
      let elapsed = stopwatch.accumulatedSeconds;
      if (stopwatch.isRunning) {
        elapsed += Math.floor((Date.now() - new Date(stopwatch.lastStartedAt).getTime()) / 1000);
      }
      setTimeUp(elapsed >= timeLimit);
    };

    check();
    if (stopwatch.isRunning) {
      const interval = setInterval(check, 1000);
      return () => clearInterval(interval);
    }
  }, [stopwatch, activeModule]);

  return timeUp;
}
