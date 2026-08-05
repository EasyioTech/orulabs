"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { StrokeData, TrainingModule } from "@oruclass/types";
import { WhiteboardBoard } from "./WhiteboardBoard";

interface Props {
  module: TrainingModule;
  trainingId: string;
  /** Participants get a view-only board; the trainer owns and broadcasts strokes. */
  readOnly: boolean;
  badge?: { text: string; className: string };
}

/**
 * The shared, broadcast whiteboard. It keeps no server state: strokes fan out over the
 * socket relay (draw:update per finished stroke, draw:clear to wipe) and a (re)joining
 * client recovers the canvas by asking peers for it (draw:request → draw:sync). The
 * board owner (trainer) is the authoritative responder to those requests.
 */
export function LiveWhiteboard({ module, trainingId, readOnly, badge }: Props) {
  const socket = useSocket();
  const [strokes, setStrokes] = useState<StrokeData[]>([]);
  const strokesRef = useRef<StrokeData[]>([]);

  const commit = useCallback((next: StrokeData[]) => {
    strokesRef.current = next;
    setStrokes(next);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onUpdate = ({ moduleId, stroke }: { moduleId: string; stroke?: StrokeData }) => {
      if (moduleId !== module.id || !stroke) return;
      commit([...strokesRef.current, stroke]);
    };
    const onClear = ({ moduleId }: { moduleId: string }) => {
      if (moduleId === module.id) commit([]);
    };
    const onSync = ({ moduleId, strokes: incoming }: { moduleId: string; strokes?: StrokeData[] }) => {
      if (moduleId === module.id && incoming) commit(incoming);
    };
    // A peer (re)joined and asked for the board — the owner answers with the full canvas.
    const onRequest = ({ moduleId }: { moduleId: string }) => {
      if (moduleId === module.id && !readOnly) {
        socket.emit("draw:sync", { trainingId, moduleId: module.id, strokes: strokesRef.current });
      }
    };
    // View-only clients pull the current board on mount and after every reconnect.
    const requestBoard = () => {
      if (readOnly) socket.emit("draw:request", { trainingId, moduleId: module.id });
    };

    socket.on("draw:update", onUpdate);
    socket.on("draw:clear", onClear);
    socket.on("draw:sync", onSync);
    socket.on("draw:request", onRequest);
    socket.on("connect", requestBoard);
    if (socket.connected) requestBoard();

    return () => {
      socket.off("draw:update", onUpdate);
      socket.off("draw:clear", onClear);
      socket.off("draw:sync", onSync);
      socket.off("draw:request", onRequest);
      socket.off("connect", requestBoard);
    };
  }, [socket, module.id, trainingId, readOnly, commit]);

  const handleStroke = useCallback(
    (stroke: StrokeData) => {
      commit([...strokesRef.current, stroke]);
      socket?.emit("draw:update", { trainingId, moduleId: module.id, stroke });
    },
    [socket, trainingId, module.id, commit],
  );

  const handleClear = useCallback(() => {
    commit([]);
    socket?.emit("draw:clear", { trainingId, moduleId: module.id });
  }, [socket, trainingId, module.id, commit]);

  return (
    <div className="flex h-full min-h-[500px] w-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/50 px-6 py-4">
        <h2 className="flex-1 font-bold text-gray-800">{module.title}</h2>
        {badge && <span className={badge.className}>{badge.text}</span>}
      </div>
      <div className="relative flex-1">
        <WhiteboardBoard
          strokes={strokes}
          readOnly={readOnly}
          onStroke={readOnly ? undefined : handleStroke}
          onClear={readOnly ? undefined : handleClear}
        />
      </div>
    </div>
  );
}
