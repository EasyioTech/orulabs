"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth";
import type { TrainingModule, StrokeData } from "@oruclass/types";
import { AdvancedWhiteboard } from "./AdvancedWhiteboard";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function WhiteboardCanvas({ module, trainingId }: Props) {
  const socket = useSocket();
  const user = useAuthStore((s) => s.user);
  const [strokes, setStrokes] = useState<StrokeData[]>([]);

  // Listen for incoming strokes
  useEffect(() => {
    const handleDraw = ({ stroke }: { stroke: StrokeData }) => {
      setStrokes((prev) => [...prev, stroke]);
    };
    
    const handleClear = () => {
      setStrokes([]);
    };

    socket.on("draw:update", handleDraw);
    socket.on("draw:clear", handleClear);

    return () => {
      socket.off("draw:update", handleDraw);
      socket.off("draw:clear", handleClear);
    };
  }, [socket]);

  const handleStrokeEnd = useCallback((stroke: StrokeData) => {
    setStrokes((prev) => [...prev, stroke]);
    socket.emit("draw:update", { moduleId: module.id, trainingId, stroke });
  }, [socket, module.id, trainingId]);

  const handleClear = useCallback(() => {
    setStrokes([]);
    socket.emit("draw:clear", { moduleId: module.id, trainingId });
  }, [socket, module.id, trainingId]);

  // Guests are QR-join participants; any credentialed (email) user is a trainer.
  const isTrainer = !!user && user.authProvider !== "guest";

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center px-4 py-3 bg-white border-b border-gray-100 shadow-sm z-10">
        <h2 className="font-bold text-gray-900">{module.title}</h2>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <AdvancedWhiteboard
          strokes={strokes}
          onStrokeEnd={handleStrokeEnd}
          onClear={handleClear}
          readonly={!isTrainer}
        />
      </div>
    </div>
  );
}

