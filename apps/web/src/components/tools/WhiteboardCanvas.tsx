"use client";

import { useEffect, useState, useCallback } from "react";
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

  useEffect(() => {
    const handleSync = ({ snapshot: newSnapshot }: { snapshot?: WhiteboardSnapshot }) => {
      if (newSnapshot) setSnapshot(newSnapshot);
    };

    socket.on("draw:sync", handleSync);
    return () => {
      socket.off("draw:sync", handleSync);
    };
  }, [socket]);

  const handleChange = useCallback((newSnapshot: WhiteboardSnapshot) => {
    socket.emit("draw:sync", { moduleId: module.id, trainingId, snapshot: newSnapshot });
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
          snapshot={snapshot}
          onChange={handleChange}
          readonly={!isTrainer}
        />
      </div>
    </div>
  );
}
