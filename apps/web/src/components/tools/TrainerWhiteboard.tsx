"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { TrainingModule } from "@oruclass/types";
import { AdvancedWhiteboard, type WhiteboardSnapshot } from "./AdvancedWhiteboard";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerWhiteboard({ module, trainingId }: Props) {
  const socket = useSocket();
  const [snapshot, setSnapshot] = useState<WhiteboardSnapshot | null>(null);
  // Latest board state, kept in a ref so we can answer a peer's draw:request without
  // re-subscribing. The trainer owns the canvas, so it's the authoritative responder.
  const latestSnapshot = useRef<WhiteboardSnapshot | null>(null);

  useEffect(() => {
    if (!socket) return;

    // We only need sync for full tldraw snapshot
    const handleSync = ({ snapshot: newSnapshot }: { snapshot?: WhiteboardSnapshot }) => {
      if (newSnapshot) {
        latestSnapshot.current = newSnapshot;
        setSnapshot(newSnapshot);
      }
    };

    // A (re)joining client asked for the current canvas — re-broadcast it.
    const handleRequest = () => {
      if (latestSnapshot.current) {
        socket.emit("draw:sync", { trainingId, moduleId: module.id, snapshot: latestSnapshot.current });
      }
    };

    socket.on("draw:sync", handleSync);
    socket.on("draw:request", handleRequest);
    return () => {
      socket.off("draw:sync", handleSync);
      socket.off("draw:request", handleRequest);
    };
  }, [socket, trainingId, module.id]);

  const handleChange = (newSnapshot: WhiteboardSnapshot) => {
    // Avoid rapid re-rendering loop; tldraw handles internal state
    latestSnapshot.current = newSnapshot;
    if (socket) {
      socket.emit("draw:sync", { trainingId, moduleId: module.id, snapshot: newSnapshot });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] min-h-[500px] bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-gray-50/50 border-b border-gray-100">
        <h2 className="font-bold text-gray-800 flex-1">{module.title}</h2>
        <span className="text-xs px-2.5 py-1 bg-brand-50 text-brand-600 font-semibold rounded-full">
          Trainer Broadcast
        </span>
      </div>
      
      <div className="flex-1 relative bg-[#f3f3f3]">
        <AdvancedWhiteboard
          snapshot={snapshot}
          onChange={handleChange}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
