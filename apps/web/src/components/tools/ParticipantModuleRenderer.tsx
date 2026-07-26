"use client";

import type { TrainingModule } from "@oruclass/types";
import dynamic from "next/dynamic";
import type { ModuleConfig } from "@oruclass/types";

const ParticipantQuiz = dynamic(() => import("./ParticipantQuiz").then(mod => mod.ParticipantQuiz), { ssr: false });
const ParticipantWhiteboard = dynamic(() => import("./ParticipantWhiteboard").then(mod => mod.ParticipantWhiteboard), { ssr: false });
const ParticipantReflectionJournal = dynamic(() => import("./ParticipantReflectionJournal").then(mod => mod.ParticipantReflectionJournal), { ssr: false });
const ParticipantMatrix = dynamic(() => import("./ParticipantMatrix").then(mod => mod.ParticipantMatrix), { ssr: false });
const ParticipantStickyNotes = dynamic(() => import("./ParticipantStickyNotes").then(mod => mod.ParticipantStickyNotes), { ssr: false });
const ParticipantAttendance = dynamic(() => import("./ParticipantAttendance").then(mod => mod.ParticipantAttendance), { ssr: false });
const ParticipantPoll = dynamic(() => import("./ParticipantPoll").then(mod => mod.ParticipantPoll), { ssr: false });
const ParticipantWordCloud = dynamic(() => import("./ParticipantWordCloud").then(mod => mod.ParticipantWordCloud), { ssr: false });
const ParticipantQnA = dynamic(() => import("./ParticipantQnA").then(mod => mod.ParticipantQnA), { ssr: false });
const ParticipantTimer = dynamic(() => import("./ParticipantTimer").then(mod => mod.ParticipantTimer), { ssr: false });
const ParticipantPulse = dynamic(() => import("./ParticipantPulse").then(mod => mod.ParticipantPulse), { ssr: false });
const ParticipantMapping = dynamic(() => import("./ParticipantMapping").then(mod => mod.ParticipantMapping), { ssr: false });
const ParticipantForm = dynamic(() => import("./ParticipantForm").then(mod => mod.ParticipantForm), { ssr: false });
const ParticipantEmbed = dynamic(() => import("./ParticipantEmbed").then(mod => mod.ParticipantEmbed), { ssr: false });
const ParticipantDocument = dynamic(() => import("./ParticipantDocument").then(mod => mod.ParticipantDocument), { ssr: false });
const MonacoLiveEditor = dynamic(() => import("./MonacoLiveEditor").then(mod => mod.MonacoLiveEditor), { ssr: false });

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
  document: ParticipantDocument,
  code: (props) => {
    const config = props.module.config as ModuleConfig;
    return (
      <div className="h-[calc(100%-80px)] w-full p-4 md:p-6">
        <MonacoLiveEditor
          language={config.codeLanguage || "javascript"}
          initialCode={config.initialCode || ""}
          value={config.initialCode || ""}
          onChange={() => {}}
          prompt={config.codePrompt}
        />
      </div>
    );
  },
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
