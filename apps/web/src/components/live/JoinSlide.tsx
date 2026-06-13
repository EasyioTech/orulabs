"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "react-qr-code";
import { Copy, Check, Link as LinkIcon, Hash, Users, Play, Lock } from "lucide-react";
import { joinTokenToCode } from "@oruclass/utils";
import { useLiveSessionStore } from "@/store/liveSession";
import { useUpdateTrainingStatus } from "@/hooks/useTrainings";
import type { Training } from "@oruclass/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
      title="Copy"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  );
}

// ── Animated counter ──────────────────────────────────────────────────────────

function CounterDigit({ digit }: { digit: string }) {
  return (
    <div className="relative h-[4rem] w-[2.6rem] overflow-hidden flex items-center justify-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: 40, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -40, opacity: 0, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="absolute text-[3.2rem] font-black leading-none text-brand-700 tabular-nums"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function ParticipantCounter({ count, names }: { count: number, names: string[] }) {
  const prev = useRef(count);
  const [pinging, setPinging] = useState(false);

  useEffect(() => {
    if (count > prev.current) {
      setPinging(true);
      setTimeout(() => setPinging(false), 900);
    }
    prev.current = count;
  }, [count]);

  const recent = [...names].reverse().slice(0, 5);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        {pinging && (
          <motion.span
            key={Date.now()}
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 rounded-full bg-brand-400 pointer-events-none"
          />
        )}
        <div className="flex -space-x-3 relative z-10">
          <AnimatePresence mode="popLayout">
            {recent.map((name, i) => (
              <motion.div
                key={`${name}-${names.length - i}`}
                initial={{ opacity: 0, scale: 0.5, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-10 h-10 rounded-full bg-white border-2 border-gray-50 flex items-center justify-center shadow-sm relative"
                style={{ zIndex: 10 - i }}
              >
                <div className="w-full h-full rounded-full bg-brand-100 flex items-center justify-center">
                  <span className="text-brand-600 font-bold text-[12px]">{name.slice(0, 2).toUpperCase()}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {count === 0 && (
            <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center z-0 relative shadow-sm">
              <Users size={16} className="text-gray-400" />
            </div>
          )}
          {count > 5 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center z-0 relative shadow-sm"
            >
              <span className="text-gray-600 font-bold text-[11px]">+{count - 5}</span>
            </motion.div>
          )}
        </div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-[10px] text-green-600 font-bold uppercase tracking-wide">Live</span>
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-center gap-1.5">
          <span className="text-4xl font-black text-gray-900 tabular-nums leading-none tracking-tight">{count}</span>
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Joined</span>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface JoinSlideProps {
  training: Training;
  trainingId: string;
  isTrainer: boolean;
}

export function JoinSlide({ training, trainingId, isTrainer }: JoinSlideProps) {
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const participants = useLiveSessionStore((s) => s.participants);
  const updateStatus = useUpdateTrainingStatus(training.workspaceId, trainingId);

  const participantList = Array.from(participants.values()).filter((p) => p.role === "participant");
  const count = participantList.length;
  const names = participantList.map((p) => p.name || `User ${p.userId.slice(0, 4)}`);

  useEffect(() => {
    fetch("/api/network")
      .then((r) => r.json())
      .then((d: { webUrl: string }) => setWebUrl(d.webUrl))
      .catch(() => setWebUrl(window.location.origin));
  }, []);

  if (!webUrl) return null;

  const joinUrl = `${webUrl}/join`;
  const directUrl = `${webUrl}/join/${training.joinToken}`;
  const code = joinTokenToCode(training.joinToken);
  const status = training.sessionStatus;

  // ── Participant waiting view ─────────────────────────────────────────────────
  if (!isTrainer) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6 py-12">
        <div className="flex flex-col items-center gap-5 max-w-xs text-center">
          {/* Animated logo mark */}
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-brand-50 border-2 border-brand-100 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" style={{ borderWidth: 3 }} />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <Check size={10} className="text-white" strokeWidth={3} />
            </span>
          </div>

          <div>
            <h3 className="text-[16px] font-bold text-gray-900 mb-1">{training.title}</h3>
            <p className="text-[13px] text-gray-500">
              {status === "connecting"
                ? "You're connected! Waiting for the trainer to start the session."
                : "The session hasn't started yet. Please wait."}
            </p>
          </div>

          {status === "connecting" && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-[12px] text-green-700 font-semibold">Connected — session starts soon</span>
            </div>
          )}

          <a
            href={`/trainings/${trainingId}`}
            className="mt-2 px-6 py-2 bg-white border border-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  // ── Trainer: DRAFT state (session not opened yet) ──────────────────────────
  if (status === "draft") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-4 sm:px-8 py-8 select-none">
        <div className="text-center">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
            Session not opened yet
          </p>
          <h3 className="text-[17px] font-bold text-gray-900">{training.title}</h3>
        </div>

        {/* Blurred/locked QR preview */}
        <div className="relative flex flex-col items-center gap-2">
          <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm relative overflow-hidden">
            <div className="blur-sm pointer-events-none opacity-40">
              <QRCode value={joinUrl} size={180} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                <Lock size={18} className="text-gray-500" />
              </div>
              <span className="text-[11px] font-semibold text-gray-500 bg-white/90 px-2 py-0.5 rounded-full">
                Not open yet
              </span>
            </div>
          </div>
          <span className="text-[11px] text-gray-400">QR code & code visible after opening</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => updateStatus.mutate("connecting")}
          disabled={updateStatus.isPending}
          className="flex items-center gap-2.5 px-8 py-3.5 bg-brand-600 text-white text-[15px] font-bold rounded-xl hover:bg-brand-700 active:scale-[.98] transition-all shadow-md shadow-brand-200 disabled:opacity-50"
        >
          <Users size={18} strokeWidth={2.5} />
          Open for Joining
        </button>

        <p className="text-[11px] text-gray-400 text-center max-w-xs">
          Participants can scan the QR or enter the code to join the waiting room. Start the session from the Controls panel when ready.
        </p>
      </div>
    );
  }

  // ── Trainer: CONNECTING state (QR shown, waiting to start) ─────────────────
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4 sm:px-8 py-8 select-none">
      <div className="text-center">
        <p className="text-[11px] font-semibold text-brand-500 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
          </span>
          Open for joining
        </p>
        <h3 className="text-[17px] font-bold text-gray-900">{training.title}</h3>
      </div>

      {/* QR + Counter */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 w-full max-w-2xl">
        {/* QR */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-2">
            <QRCode value={directUrl} size={160} className="md:w-[180px] md:h-[180px] w-[160px] h-[160px]" />
          </div>
          <span className="flex items-center gap-1 text-[12px] text-gray-400 font-medium">
            <LinkIcon size={12} />
            Scan to join
          </span>
        </div>

        {/* Counter */}
        <div className="flex flex-col items-center gap-2 min-w-[220px]">
          <ParticipantCounter count={count} names={names} />
        </div>
      </div>

      {/* Code + Link */}
      <div className="w-full max-w-sm flex flex-col gap-4 mt-4">
        {/* XXX-XXX code */}
        <div className="flex flex-col items-center">
          <p className="text-[12px] text-gray-400 font-medium mb-2 flex items-center gap-1">
            <Hash size={12} />
            Session code
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center justify-center gap-2 bg-gray-50/50 rounded-xl py-3 px-6">
              <span className="text-3xl font-extrabold tracking-widest text-brand-700 font-mono">
                {code.slice(0, 3)}
              </span>
              <span className="text-2xl font-bold text-gray-300">—</span>
              <span className="text-3xl font-extrabold tracking-widest text-brand-700 font-mono">
                {code.slice(3)}
              </span>
            </div>
            <CopyButton text={code} />
          </div>
        </div>

        {/* Link */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 max-w-[280px] w-full">
            <span className="text-[12px] text-gray-500 truncate flex-1 font-mono">{directUrl}</span>
            <CopyButton text={directUrl} />
          </div>
        </div>
      </div>

      {/* Start Session CTA */}
      <button
        onClick={() => updateStatus.mutate("live")}
        disabled={updateStatus.isPending}
        className="flex items-center gap-2.5 px-8 py-3.5 bg-green-600 text-white text-[15px] font-bold rounded-xl hover:bg-green-700 active:scale-[.98] transition-all shadow-md shadow-green-200 disabled:opacity-50"
      >
        <Play size={18} strokeWidth={2.5} />
        Start Session
      </button>
    </div>
  );
}
