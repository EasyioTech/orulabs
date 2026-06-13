import { create } from "zustand";

interface StopwatchState {
  elapsedSeconds: number;
  isRunning: boolean;
  moduleId: string | null;
  intervalId: NodeJS.Timeout | null;
  start: (moduleId: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

export const useStopwatchStore = create<StopwatchState>((set, get) => ({
  elapsedSeconds: 0,
  isRunning: false,
  moduleId: null,
  intervalId: null,

  start: (moduleId: string) => {
    const { intervalId, stop } = get();
    if (intervalId) stop();
    
    const newInterval = setInterval(() => {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }, 1000);

    set({
      elapsedSeconds: 0,
      isRunning: true,
      moduleId,
      intervalId: newInterval,
    });
  },

  pause: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ isRunning: false, intervalId: null });
  },

  resume: () => {
    const { isRunning, intervalId, moduleId } = get();
    if (isRunning || !moduleId) return;
    if (intervalId) clearInterval(intervalId);
    
    const newInterval = setInterval(() => {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }, 1000);

    set({ isRunning: true, intervalId: newInterval });
  },

  stop: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ isRunning: false, intervalId: null, moduleId: null });
  },

  reset: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ elapsedSeconds: 0, isRunning: false, intervalId: null, moduleId: null });
  }
}));
