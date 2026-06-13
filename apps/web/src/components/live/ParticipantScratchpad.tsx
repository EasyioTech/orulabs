"use client";

import { useState } from "react";
import { Plus, PenTool, Edit3, X } from "lucide-react";
import { ParticipantNotesWidget } from "./ParticipantNotesWidget";
import { ParticipantWhiteboardWidget } from "./ParticipantWhiteboardWidget";
import { cn } from "@oruclass/utils";

export function ParticipantScratchpad({ trainingId }: { trainingId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeWidget, setActiveWidget] = useState<"notes" | "whiteboard" | null>(null);

  const toggleOpen = () => {
    if (isOpen) {
      setIsOpen(false);
      setActiveWidget(null);
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Active Widget Panel */}
      {activeWidget === "notes" && (
        <ParticipantNotesWidget trainingId={trainingId} onClose={() => setActiveWidget(null)} />
      )}
      {activeWidget === "whiteboard" && (
        <ParticipantWhiteboardWidget trainingId={trainingId} onClose={() => setActiveWidget(null)} />
      )}

      {/* Expanded Menu */}
      <div 
        className={cn(
          "flex flex-col gap-3 transition-all duration-300 origin-bottom transform",
          isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-8 pointer-events-none"
        )}
      >
        <button
          onClick={() => { setActiveWidget(activeWidget === "whiteboard" ? null : "whiteboard"); }}
          className={cn(
            "flex items-center gap-3 bg-white px-4 py-3 rounded-full shadow-lg border border-gray-100 text-sm font-semibold hover:bg-brand-50 transition-colors group",
            activeWidget === "whiteboard" ? "border-brand-500 bg-brand-50 text-brand-700" : "text-gray-700"
          )}
        >
          <span className="hidden sm:inline-block pr-1 group-hover:text-brand-600 transition-colors">Personal Whiteboard</span>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <PenTool size={16} />
          </div>
        </button>
        
        <button
          onClick={() => { setActiveWidget(activeWidget === "notes" ? null : "notes"); }}
          className={cn(
            "flex items-center gap-3 bg-white px-4 py-3 rounded-full shadow-lg border border-gray-100 text-sm font-semibold hover:bg-brand-50 transition-colors group",
            activeWidget === "notes" ? "border-brand-500 bg-brand-50 text-brand-700" : "text-gray-700"
          )}
        >
          <span className="hidden sm:inline-block pr-1 group-hover:text-brand-600 transition-colors">Personal Notes</span>
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
            <Edit3 size={16} />
          </div>
        </button>
      </div>

      {/* Main FAB */}
      <button
        onClick={toggleOpen}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 z-10",
          isOpen 
            ? "bg-gray-800 hover:bg-gray-900 rotate-45 scale-90" 
            : "bg-brand-600 hover:bg-brand-700 hover:scale-105 hover:shadow-lg"
        )}
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
