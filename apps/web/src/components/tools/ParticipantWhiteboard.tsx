"use client";

import type { TrainingModule } from "@oruclass/types";
import { LiveWhiteboard } from "./whiteboard/LiveWhiteboard";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantWhiteboard({ module, trainingId }: Props) {
  return (
    <LiveWhiteboard
      module={module}
      trainingId={trainingId}
      readOnly
      badge={{ text: "View Only", className: "rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600" }}
    />
  );
}
