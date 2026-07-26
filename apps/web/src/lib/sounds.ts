"use client";

// Lazily initialize AudioContext to avoid creating it before user interaction
let audioCtx: AudioContext | null = null;

function getContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume context if suspended (browser auto-play policy)
  if (audioCtx?.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playJoinSound() {
  const ctx = getContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  // Ascending dual tone
  osc.frequency.setValueAtTime(440, t); // A4
  osc.frequency.setValueAtTime(554.37, t + 0.1); // C#5

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

  osc.start(t);
  osc.stop(t + 0.5);
}

export function playLeaveSound() {
  const ctx = getContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  // Descending dual tone
  osc.frequency.setValueAtTime(554.37, t); // C#5
  osc.frequency.setValueAtTime(440, t + 0.15); // A4

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

  osc.start(t);
  osc.stop(t + 0.5);
}

export function playSuccessSound() {
  const ctx = getContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "triangle";
  // Bright ascending chime
  osc.frequency.setValueAtTime(523.25, t); // C5
  osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
  osc.frequency.setValueAtTime(783.99, t + 0.2); // G5

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

  osc.start(t);
  osc.stop(t + 0.7);
}

export function playPop() {
  const ctx = getContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);

  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

  osc.start(t);
  osc.stop(t + 0.15);
}
