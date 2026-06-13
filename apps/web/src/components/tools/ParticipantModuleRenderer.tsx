"use client";

import type { TrainingModule } from "@oruclass/types";
import { ParticipantQuiz } from "./ParticipantQuiz";
import { ParticipantWhiteboard } from "./ParticipantWhiteboard";
import { ParticipantReflectionJournal } from "./ParticipantReflectionJournal";
import { ParticipantMatrix } from "./ParticipantMatrix";
import { ParticipantStickyNotes } from "./ParticipantStickyNotes";
import { ParticipantAttendance } from "./ParticipantAttendance";
import { ParticipantPoll } from "./ParticipantPoll";
import { ParticipantWordCloud } from "./ParticipantWordCloud";
import { ParticipantQnA } from "./ParticipantQnA";
import { ParticipantTimer } from "./ParticipantTimer";
import { ParticipantPulse } from "./ParticipantPulse";
import { ParticipantMapping } from "./ParticipantMapping";
import { ParticipantForm } from "./ParticipantForm";
import { ParticipantEmbed } from "./ParticipantEmbed";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

const moduleComponentMap: Record<string, React.ComponentType<Props>> = {
  attendance: ParticipantAttendance,
  quiz: ParticipantQuiz,
  whiteboard: ParticipantWhiteboard,
  reflection: ParticipantReflectionJournal,
  matrix: ParticipantMatrix,
  custom: ParticipantStickyNotes,
  poll: ParticipantPoll,
  wordcloud: ParticipantWordCloud,
  qna: ParticipantQnA,
  timer: ParticipantTimer,
  pulse: ParticipantPulse,
  mapping: ParticipantMapping,
  form: ParticipantForm,
  embed: ParticipantEmbed,
};

export function ParticipantModuleRenderer({ module, trainingId }: Props) {
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
