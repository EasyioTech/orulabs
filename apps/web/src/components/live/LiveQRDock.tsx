"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { X, QrCode, Copy, Check, Link as LinkIcon, Hash } from "lucide-react";
import QRCode from "react-qr-code";
import { joinTokenToCode } from "@oruclass/utils";
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

interface Props {
  training: Training;
  onClose: () => void;
  boundsRef?: React.RefObject<HTMLDivElement | null>;
}

export function LiveQRDock({ training, onClose, boundsRef }: Props) {
  const [webUrl, setWebUrl] = useState("");

  useEffect(() => {
    fetch("/api/network")
      .then((r) => r.json())
      .then((d: { webUrl: string }) => setWebUrl(d.webUrl))
      .catch(() => setWebUrl(window.location.origin));
  }, []);

  if (!webUrl) return null;

  const directUrl = `${webUrl}/join/${training.joinToken}`;
  const code = joinTokenToCode(training.joinToken);

  return (
    <motion.div
      drag
      dragConstraints={boundsRef}
      dragElastic={0.1}
      dragMomentum={false}
      className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col cursor-move"
      style={{
        bottom: 100, // Slightly higher than bottom nav
        left: "50%",
        x: "-50%", // Center horizontally by default
        width: 360,
        touchAction: "none",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-2 text-gray-700">
          <QrCode size={16} />
          <span className="text-[15px] font-semibold">Join Info</span>
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center gap-6 p-6 select-none bg-gray-50/30">
        
        {/* QR Code */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
            <QRCode value={directUrl} size={160} />
          </div>
          <span className="flex items-center gap-1 text-[12px] text-gray-400 font-medium">
            <LinkIcon size={12} />
            Scan to join
          </span>
        </div>

        <div className="w-full flex flex-col gap-4">
          {/* Session Code */}
          <div className="flex flex-col items-center">
            <p className="text-[12px] text-gray-400 font-medium mb-1.5 flex items-center gap-1">
              <Hash size={12} />
              Session code
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center gap-2 bg-gray-100/80 rounded-lg py-2 px-4 w-[200px]">
                <span className="text-2xl font-extrabold tracking-widest text-brand-600 font-mono">
                  {code.slice(0, 3)}
                </span>
                <span className="text-xl font-bold text-gray-300">—</span>
                <span className="text-2xl font-extrabold tracking-widest text-brand-600 font-mono">
                  {code.slice(3)}
                </span>
              </div>
              <CopyButton text={code} />
            </div>
          </div>

          {/* Direct Link */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 bg-gray-100/80 rounded-lg px-3 py-2 w-full">
              <span className="text-[11px] text-gray-500 truncate flex-1 font-mono">
                {directUrl}
              </span>
              <CopyButton text={directUrl} />
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
