"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { TrainingModule, StrokeData } from "@oruclass/types";
import { AdvancedWhiteboard } from "./AdvancedWhiteboard";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerWhiteboard({ module, trainingId }: Props) {
  const socket = useSocket();
  const [strokes, setStrokes] = useState<StrokeData[]>([]);

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = ({ stroke }: { stroke: StrokeData }) => {
      setStrokes((prev) => [...prev, stroke]);
    };

    const handleClear = () => {
      setStrokes([]);
    };

    const handleSync = ({ strokes }: { strokes: StrokeData[] }) => {
      setStrokes(strokes);
    };

    socket.on("draw:update", handleUpdate);
    socket.on("draw:clear", handleClear);
    socket.on("draw:sync", handleSync);

    return () => {
      socket.off("draw:update", handleUpdate);
      socket.off("draw:clear", handleClear);
      socket.off("draw:sync", handleSync);
    };
  }, [socket]);

  const handleStrokeEnd = (stroke: StrokeData) => {
    setStrokes((prev) => [...prev, stroke]);
    if (socket) {
      socket.emit("draw:update", { trainingId, moduleId: module.id, stroke });
    }
  };

  const handleStrokesChange = (newStrokes: StrokeData[]) => {
    setStrokes(newStrokes);
    if (socket) {
      socket.emit("draw:sync", { trainingId, moduleId: module.id, strokes: newStrokes });
    }
  };

  const handleClear = () => {
    setStrokes([]);
    if (socket) {
      socket.emit("draw:clear", { trainingId, moduleId: module.id });
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
          strokes={strokes}
          onStrokeEnd={handleStrokeEnd}
          onStrokesChange={handleStrokesChange}
          onClear={handleClear}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
