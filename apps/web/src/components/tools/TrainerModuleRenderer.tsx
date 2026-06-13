"use client";

import type { TrainingModule } from "@oruclass/types";
import { TrainerQuiz } from "./TrainerQuiz";
import { TrainerWhiteboard } from "./TrainerWhiteboard";
import { TrainerReflectionJournal } from "./TrainerReflectionJournal";
import { TrainerMatrix } from "./TrainerMatrix";
import { TrainerStickyNotes } from "./TrainerStickyNotes";
import { TrainerAttendance } from "./TrainerAttendance";
import { TrainerPoll } from "./TrainerPoll";
import { TrainerWordCloud } from "./TrainerWordCloud";
import { TrainerQnA } from "./TrainerQnA";
import { TrainerTimer } from "./TrainerTimer";
import { TrainerPulse } from "./TrainerPulse";
import { TrainerMapping } from "./TrainerMapping";
import { TrainerForm } from "./TrainerForm";
import { TrainerEmbed } from "./TrainerEmbed";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

const moduleComponentMap: Record<string, React.ComponentType<Props>> = {
  attendance: TrainerAttendance,
  quiz: TrainerQuiz,
  whiteboard: TrainerWhiteboard,
  reflection: TrainerReflectionJournal,
  matrix: TrainerMatrix,
  custom: TrainerStickyNotes,
  poll: TrainerPoll,
  wordcloud: TrainerWordCloud,
  qna: TrainerQnA,
  timer: TrainerTimer,
  pulse: TrainerPulse,
  mapping: TrainerMapping,
  form: TrainerForm,
  embed: TrainerEmbed,
};

export function TrainerModuleRenderer({ module, trainingId }: Props) {
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
