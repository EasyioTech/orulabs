"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParticipantScratchpad, useUpdateParticipantScratchpad } from "@/hooks/useParticipantScratchpad";
import { X, Save, CheckCircle2 } from "lucide-react";
import type { StrokeData } from "@oruclass/types";
import { WhiteboardBoard } from "../tools/whiteboard/WhiteboardBoard";

export function ParticipantWhiteboardWidget({ trainingId, onClose }: { trainingId: string; onClose: () => void }) {
  const { data: scratchpad, isLoading } = useParticipantScratchpad(trainingId);
  const updateScratchpad = useUpdateParticipantScratchpad(trainingId);

  const [strokes, setStrokes] = useState<StrokeData[]>([]);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hydratedRef = useRef(false);

  // Hydrate once from the persisted scratchpad.
  useEffect(() => {
    if (hydratedRef.current) return;
    const saved = scratchpad?.personalWhiteboard?.strokes;
    if (Array.isArray(saved)) {
      setStrokes(saved as StrokeData[]);
      hydratedRef.current = true;
    }
  }, [scratchpad?.personalWhiteboard]);

  const persist = useCallback(
    (next: StrokeData[]) => {
      setSaveStatus("saving");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        updateScratchpad.mutate(
          { personalWhiteboard: { strokes: next } },
          {
            onSuccess: () => {
              setSaveStatus("saved");
              setTimeout(() => setSaveStatus("idle"), 2000);
            },
          },
        );
      }, 1000);
    },
    [updateScratchpad],
  );

  const handleStroke = useCallback(
    (stroke: StrokeData) => {
      setStrokes((prev) => {
        const next = [...prev, stroke];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const handleClear = useCallback(() => {
    setStrokes([]);
    persist([]);
  }, [persist]);

  return (
    <div className="animate-in slide-in-from-bottom-8 fade-in fixed inset-0 z-[60] flex flex-col overflow-hidden bg-white shadow-lg duration-200 md:relative md:z-auto md:h-[500px] md:w-[600px] md:max-w-[90vw] md:rounded-xl md:border md:border-gray-100">
      <div className="z-20 flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">Personal Whiteboard</h3>
        <div className="flex items-center gap-3">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <Save size={10} className="animate-pulse" /> Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-[10px] text-green-500">
              <CheckCircle2 size={10} /> Saved
            </span>
          )}
          <button onClick={onClose} className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-200">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <div className="border-brand-500 h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : (
          <WhiteboardBoard strokes={strokes} onStroke={handleStroke} onClear={handleClear} />
        )}
      </div>
    </div>
  );
}
