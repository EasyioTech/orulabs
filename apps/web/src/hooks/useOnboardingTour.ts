"use client";

import { useCallback, useEffect, useRef } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

/**
 * Runs a short product tour the first time a user lands on a page, then never
 * again (remembered in localStorage). `startTour` lets them replay it on demand
 * from a "Take a tour" button. Keep step copy short and plain — see the trainer
 * and participant step lists for the expected tone.
 */
export function useOnboardingTour(key: string, steps: DriveStep[], ready = true) {
  const startedRef = useRef(false);

  const run = useCallback(() => {
    const d = driver({
      showProgress: steps.length > 1,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next",
      prevBtnText: "Back",
      doneBtnText: "Got it!",
      popoverClass: "oru-tour",
      allowClose: true,
      steps,
    });
    d.drive();
  }, [steps]);

  // First visit only: wait a beat so target elements have painted, then run once.
  useEffect(() => {
    if (!ready || startedRef.current || typeof window === "undefined") return;
    if (localStorage.getItem(`tour:${key}`)) return;
    startedRef.current = true;
    const t = setTimeout(() => {
      localStorage.setItem(`tour:${key}`, "1");
      run();
    }, 700);
    return () => clearTimeout(t);
  }, [key, ready, run]);

  const startTour = useCallback(() => run(), [run]);

  return { startTour };
}
