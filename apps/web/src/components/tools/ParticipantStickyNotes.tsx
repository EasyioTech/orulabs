"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth";
import type { TrainingModule, StickyNote } from "@oruclass/types";
import { cn } from "@oruclass/utils";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { StickyBoard } from "./StickyBoard";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

const NOTE_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff"];

export function ParticipantStickyNotes({ module, trainingId }: Props) {
  const socket = useSocket();
  const user = useAuthStore((s) => s.user);
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [draft, setDraft] = useState("");
  const [color, setColor] = useState(NOTE_COLORS[0]);

  useEffect(() => {
    const onCreate = ({ note }: { note: StickyNote }) =>
      setNotes((prev) => [...prev, note]);
    const onPosition = ({ noteId, x, y }: { noteId: string; x: number; y: number }) =>
      setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, x, y } : n)));

    socket.on("note:create", onCreate);
    socket.on("note:position", onPosition);
    return () => {
      socket.off("note:create", onCreate);
      socket.off("note:position", onPosition);
    };
  }, [socket]);

  const addNote = () => {
    if (!draft.trim() || !user) return;
    const note: StickyNote = {
      id: crypto.randomUUID(),
      text: draft,
      color,
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
    };
    setNotes((prev) => [...prev, note]);
    socket.emit("note:create", { trainingId, moduleId: module.id, note });
    setDraft("");
  };

  const moveNote = (noteId: string, x: number, y: number) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, x, y } : n)));
    socket.emit("note:position", { trainingId, moduleId: module.id, noteId, x, y });
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <h2 className="font-bold text-gray-900">{module.title}</h2>

      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <RichTextEditor
            value={draft}
            onChange={setDraft}
            placeholder="Add a sticky note…"
            minHeight="60px"
          />
        </div>
        <div className="flex gap-1">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform",
                color === c ? "border-gray-600 scale-110" : "border-transparent",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          onClick={addNote}
          disabled={!draft.trim()}
          className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </div>

      <StickyBoard
        notes={notes}
        onMove={moveNote}
        emptyState={
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No notes yet. Add one above!
          </div>
        }
      />
    </div>
  );
}
