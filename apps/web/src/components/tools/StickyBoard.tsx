"use client";

import { useRef } from "react";
import { SafeHTML } from "@/components/ui/SafeHTML";
import type { StickyNote } from "@oruclass/types";

interface Props {
  notes: StickyNote[];
  /** Called as a note is dragged. Wire this to local state + socket emit. */
  onMove: (noteId: string, x: number, y: number) => void;
  emptyState?: React.ReactNode;
}

/**
 * A relative board of draggable sticky notes. Uses Pointer Events so the same
 * code drives mouse drag (PC) and touch drag (phone). Positions are clamped to
 * the board so notes can never be dragged out of view on small screens.
 */
export function StickyBoard({ notes, onMove, emptyState }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>, note: StickyNote) => {
    const board = boardRef.current;
    const card = e.currentTarget;
    if (!board) return;
    // Don't hijack drags that start inside selectable/interactive content.
    card.setPointerCapture(e.pointerId);

    const boardRect = board.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    // Pointer offset within the card, so it doesn't jump to the cursor.
    const grabX = e.clientX - cardRect.left;
    const grabY = e.clientY - cardRect.top;

    const onPointerMove = (ev: PointerEvent) => {
      const maxX = Math.max(0, boardRect.width - cardRect.width);
      const maxY = Math.max(0, boardRect.height - cardRect.height);
      const x = Math.min(Math.max(0, ev.clientX - boardRect.left - grabX), maxX);
      const y = Math.min(Math.max(0, ev.clientY - boardRect.top - grabY), maxY);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => onMove(note.id, x, y));
    };

    const onPointerUp = () => {
      card.removeEventListener("pointermove", onPointerMove);
      card.removeEventListener("pointerup", onPointerUp);
      card.removeEventListener("pointercancel", onPointerUp);
    };

    card.addEventListener("pointermove", onPointerMove);
    card.addEventListener("pointerup", onPointerUp);
    card.addEventListener("pointercancel", onPointerUp);
  };

  return (
    <div
      ref={boardRef}
      className="flex-1 relative border border-gray-100 rounded-lg bg-gray-50 overflow-hidden touch-none"
    >
      {notes.map((note) => (
        <div
          key={note.id}
          onPointerDown={(e) => startDrag(e, note)}
          className="absolute w-40 sm:w-48 min-h-[100px] p-3 rounded-lg shadow-md text-sm cursor-grab active:cursor-grabbing select-none border border-black/10 overflow-hidden touch-none"
          style={{ backgroundColor: note.color, left: note.x, top: note.y }}
        >
          <SafeHTML html={note.text} className="prose prose-sm max-w-none pointer-events-none" />
        </div>
      ))}
      {notes.length === 0 && emptyState}
    </div>
  );
}
