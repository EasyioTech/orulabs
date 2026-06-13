"use client";

import type { TrainingModule } from "@oruclass/types";
import { QuizRenderer } from "./QuizRenderer";
import { WhiteboardCanvas } from "./WhiteboardCanvas";
import { ReflectionJournal } from "./ReflectionJournal";
import { MatrixEditor } from "./MatrixEditor";
import { StickyNotePad } from "./StickyNotePad";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

const moduleComponentMap: Record<string, React.ComponentType<Props>> = {
  quiz: QuizRenderer,
  whiteboard: WhiteboardCanvas,
  reflection: ReflectionJournal,
  matrix: MatrixEditor,
  custom: StickyNotePad,
};

export function ActiveModuleRenderer({ module, trainingId }: Props) {
  const Component = moduleComponentMap[module.moduleType];

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 p-8">
        <p>Unknown module type: {module.moduleType}</p>
      </div>
    );
  }

  return <Component module={module} trainingId={trainingId} />;
}
