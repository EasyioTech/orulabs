"use client";

import { useState, useEffect, useRef } from "react";
import { useParticipantScratchpad, useUpdateParticipantScratchpad } from "@/hooks/useParticipantScratchpad";
import { X, Save, CheckCircle2, Eraser } from "lucide-react";
import type { StrokeData } from "@oruclass/types";

import { AdvancedWhiteboard } from "../tools/AdvancedWhiteboard";

export function ParticipantWhiteboardWidget({ trainingId, onClose }: { trainingId: string; onClose: () => void }) {
  const { data: scratchpad, isLoading } = useParticipantScratchpad(trainingId);
  const updateScratchpad = useUpdateParticipantScratchpad(trainingId);
  
  const [strokes, setStrokes] = useState<StrokeData[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from scratchpad
  useEffect(() => {
    if (scratchpad?.personalWhiteboard && Array.isArray(scratchpad.personalWhiteboard.strokes)) {
      setStrokes(scratchpad.personalWhiteboard.strokes as StrokeData[]);
    }
  }, [scratchpad?.personalWhiteboard]);

  const saveStrokes = (newStrokes: StrokeData[]) => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      updateScratchpad.mutate(
        { personalWhiteboard: { strokes: newStrokes } },
        {
          onSuccess: () => {
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          },
        }
      );
    }, 1000);
  };

  const handleStrokeEnd = (stroke: StrokeData) => {
    setStrokes(prev => {
      const updated = [...prev, stroke];
      saveStrokes(updated);
      return updated;
    });
  };

  const handleStrokesChange = (newStrokes: StrokeData[]) => {
    setStrokes(newStrokes);
    saveStrokes(newStrokes);
  };

  const handleClear = () => {
    setStrokes([]);
    saveStrokes([]);
  };

  return (
    <div className="flex flex-col fixed inset-0 z-[60] md:relative md:z-auto md:h-[500px] md:w-[600px] md:max-w-[90vw] bg-white md:rounded-xl shadow-lg md:border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 z-20">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800 text-sm">Personal Whiteboard</h3>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Save size={10} className="animate-pulse" /> Saving...</span>}
          {saveStatus === "saved" && <span className="text-[10px] text-green-500 flex items-center gap-1"><CheckCircle2 size={10} /> Saved</span>}
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-500">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AdvancedWhiteboard
            strokes={strokes}
            onStrokeEnd={handleStrokeEnd}
            onStrokesChange={handleStrokesChange}
            onClear={handleClear}
          />
        )}
      </div>
    </div>
  );
}
