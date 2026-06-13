"use client";

import { useState, useEffect, useRef } from "react";
import { useParticipantScratchpad, useUpdateParticipantScratchpad } from "@/hooks/useParticipantScratchpad";
import { X, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";

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

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

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
    <div className="flex flex-col h-[500px] w-[380px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800 text-sm">Personal Notes</h3>
          {saveStatus === "saving" && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Save size={10} className="animate-pulse" /> Saving...</span>}
          {saveStatus === "saved" && <span className="text-[10px] text-green-500 flex items-center gap-1"><CheckCircle2 size={10} /> Saved</span>}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={handleChange}
            placeholder="Start typing your notes here... (They save automatically)"
            className="w-full h-full min-h-[400px] resize-none outline-none text-gray-800 text-sm leading-relaxed placeholder:text-gray-300"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          />
        )}
      </div>
    </div>
  );
}
