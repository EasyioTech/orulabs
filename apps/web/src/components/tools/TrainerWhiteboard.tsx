"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import type { TrainingModule } from "@oruclass/types";
import { AdvancedWhiteboard } from "./AdvancedWhiteboard";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerWhiteboard({ module, trainingId }: Props) {
  const socket = useSocket();
  const [snapshot, setSnapshot] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;
    
    // We only need sync for full tldraw snapshot
    const handleSync = ({ snapshot: newSnapshot }: { snapshot?: any }) => {
      if (newSnapshot) setSnapshot(newSnapshot);
    };

    socket.on("draw:sync", handleSync);
    return () => {
      socket.off("draw:sync", handleSync);
    };
  }, [socket]);

  const handleChange = (newSnapshot: any) => {
    // Avoid rapid re-rendering loop; tldraw handles internal state
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
