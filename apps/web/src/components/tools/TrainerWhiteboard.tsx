"use client";

import type { TrainingModule } from "@oruclass/types";
import { LiveWhiteboard } from "./whiteboard/LiveWhiteboard";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerWhiteboard({ module, trainingId }: Props) {
  return (
    <LiveWhiteboard
      module={module}
      trainingId={trainingId}
      readOnly={false}
      badge={{ text: "Trainer Broadcast", className: "rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600" }}
    />
  );
}
