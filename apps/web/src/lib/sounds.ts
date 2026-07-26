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

// Someone joins the meeting — ascending twin-tone chime
export function playJoinSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.setValueAtTime(554.37, t + 0.1);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
  osc.start(t);
  osc.stop(t + 0.5);
}

// Someone leaves the meeting — descending twin-tone
export function playLeaveSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(554.37, t);
  osc.frequency.setValueAtTime(440, t + 0.15);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
  osc.start(t);
  osc.stop(t + 0.5);
}

// Session started — bright uplifting three-note chime
export function playSessionStartSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(523.25, t);   // C5
  osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
  osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
  osc.start(t);
  osc.stop(t + 0.8);
}

// Session paused — soft descending minor tone
export function playSessionPauseSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(440, t);      // A4
  osc.frequency.setValueAtTime(415.3, t + 0.15); // Ab4 (minor feel)
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
  osc.start(t);
  osc.stop(t + 0.6);
}

// Session resumed — medium ascending two-note bounce
export function playSessionResumeSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(415.3, t);   // Ab4
  osc.frequency.setValueAtTime(523.25, t + 0.12); // C5
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.14, t + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
  osc.start(t);
  osc.stop(t + 0.6);
}

// Session ended — closing descending three-note tone
export function playSessionEndSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(523.25, t);   // C5
  osc.frequency.setValueAtTime(415.3, t + 0.12); // Ab4
  osc.frequency.setValueAtTime(349.23, t + 0.25); // F4
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
  osc.start(t);
  osc.stop(t + 0.8);
}

// New chat message received — short subtle pop
export function playChatSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(660, t + 0.08);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
  osc.start(t);
  osc.stop(t + 0.15);
}

// UI interaction pop (copy link etc.)
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
