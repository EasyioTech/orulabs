"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useParticipantScratchpad, useUpdateParticipantScratchpad } from "@/hooks/useParticipantScratchpad";
import { X, Save, CheckCircle2, Move } from "lucide-react";

export function ParticipantNotesWidget({ trainingId, onClose }: { trainingId: string; onClose: () => void }) {
  const { data: scratchpad, isLoading } = useParticipantScratchpad(trainingId);
  const updateScratchpad = useUpdateParticipantScratchpad(trainingId);

  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (scratchpad?.personalNotes !== undefined) {
      setContent(scratchpad.personalNotes);
    }
  }, [scratchpad?.personalNotes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setSaveStatus("saving");

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      updateScratchpad.mutate(
        { personalNotes: newContent },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          },
        }
      );
    }, 1000);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      className="fixed z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden cursor-move"
      style={{
        width: 360,
        height: 480,
        bottom: 90,
        right: 24,
        touchAction: "none",
      }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
    >
      {/* Header — drag handle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-amber-50 flex-shrink-0">
        <div className="flex items-center gap-2 text-amber-700">
          <Move size={13} className="opacity-60" />
          <h3 className="font-semibold text-sm">Personal Notes</h3>
          {saveStatus === "saving" && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1 ml-1">
              <Save size={10} className="animate-pulse" /> Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-[10px] text-green-500 flex items-center gap-1 ml-1">
              <CheckCircle2 size={10} /> Saved
            </span>
          )}
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          className="p-1 hover:bg-amber-100 rounded-lg transition-colors text-amber-600"
        >
          <X size={15} />
        </button>
      </div>

      {/* Notes body */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={handleChange}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Start typing your notes here… (They save automatically)"
            className="w-full h-full resize-none outline-none text-gray-800 text-sm leading-relaxed placeholder:text-gray-300 p-4 cursor-text"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          />
        )}
      </div>
    </motion.div>
  );
}
