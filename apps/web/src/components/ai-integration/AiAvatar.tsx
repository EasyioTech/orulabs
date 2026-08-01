"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AiChatPanel } from "./AiChatPanel";
import { CrabAvatar } from "./CrabAvatar";
import { useAIStore } from "@/stores/useAIStore";

export function AiAvatar() {
  const [open, setOpen] = useState(false);
  const enabled = useAIStore((s) => s.enabled);

  if (!enabled) return null;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-[360px] h-[500px] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <AiChatPanel onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Floating Avatar */}
      <div
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 transition-transform hover:scale-110 active:scale-95 group"
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
      >
        <div className="relative">
          <CrabAvatar />
          {open && (
            <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-red-500 hover:bg-red-50 border border-gray-100">
              <X size={14} strokeWidth={3} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
