"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth";
import type { TrainingModule } from "@oruclass/types";
import { AdvancedWhiteboard, type WhiteboardSnapshot } from "./AdvancedWhiteboard";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function WhiteboardCanvas({ module, trainingId }: Props) {
  const socket = useSocket();
  const user = useAuthStore((s) => s.user);
  const [snapshot, setSnapshot] = useState<WhiteboardSnapshot | null>(null);
  const latestSnapshot = useRef<WhiteboardSnapshot | null>(null);

  // Guests are QR-join participants; any credentialed (email) user is a trainer.
  const isTrainer = !!user && user.authProvider !== "guest";

  useEffect(() => {
    const handleSync = ({ snapshot: newSnapshot }: { snapshot?: WhiteboardSnapshot }) => {
      if (newSnapshot) {
        latestSnapshot.current = newSnapshot;
        setSnapshot(newSnapshot);
      }
    };

    // Reconnect recovery for the stateless whiteboard relay: the trainer answers a
    // peer's draw:request with the current canvas; participants ask for it on every
    // (re)connect instead of waiting for the trainer's next stroke.
    const handleRequest = () => {
      if (isTrainer && latestSnapshot.current) {
        socket.emit("draw:sync", { moduleId: module.id, trainingId, snapshot: latestSnapshot.current });
      }
    };
    const requestBoard = () => {
      if (!isTrainer) socket.emit("draw:request", { trainingId, moduleId: module.id });
    };

    socket.on("draw:sync", handleSync);
    socket.on("draw:request", handleRequest);
    socket.on("connect", requestBoard);
    if (socket.connected) requestBoard();
    return () => {
      socket.off("draw:sync", handleSync);
      socket.off("draw:request", handleRequest);
      socket.off("connect", requestBoard);
    };
  }, [socket, isTrainer, module.id, trainingId]);

  const handleChange = useCallback((newSnapshot: WhiteboardSnapshot) => {
    latestSnapshot.current = newSnapshot;
    socket.emit("draw:sync", { moduleId: module.id, trainingId, snapshot: newSnapshot });
  }, [socket, module.id, trainingId]);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center px-4 py-3 bg-white border-b border-gray-100 shadow-sm z-10">
        <h2 className="font-bold text-gray-900">{module.title}</h2>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <AdvancedWhiteboard
          snapshot={snapshot}
          onChange={handleChange}
          readonly={!isTrainer}
        />
      </div>
    </div>
  );
}
