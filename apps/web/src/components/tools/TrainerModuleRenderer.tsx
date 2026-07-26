"use client";

import type { TrainingModule } from "@oruclass/types";
import dynamic from "next/dynamic";
import type { ModuleConfig } from "@oruclass/types";

const TrainerQuiz = dynamic(() => import("./TrainerQuiz").then(mod => mod.TrainerQuiz), { ssr: false });
const TrainerWhiteboard = dynamic(() => import("./TrainerWhiteboard").then(mod => mod.TrainerWhiteboard), { ssr: false });
const TrainerReflectionJournal = dynamic(() => import("./TrainerReflectionJournal").then(mod => mod.TrainerReflectionJournal), { ssr: false });
const TrainerMatrix = dynamic(() => import("./TrainerMatrix").then(mod => mod.TrainerMatrix), { ssr: false });
const TrainerStickyNotes = dynamic(() => import("./TrainerStickyNotes").then(mod => mod.TrainerStickyNotes), { ssr: false });
const TrainerAttendance = dynamic(() => import("./TrainerAttendance").then(mod => mod.TrainerAttendance), { ssr: false });
const TrainerPoll = dynamic(() => import("./TrainerPoll").then(mod => mod.TrainerPoll), { ssr: false });
const TrainerWordCloud = dynamic(() => import("./TrainerWordCloud").then(mod => mod.TrainerWordCloud), { ssr: false });
const TrainerQnA = dynamic(() => import("./TrainerQnA").then(mod => mod.TrainerQnA), { ssr: false });
const TrainerTimer = dynamic(() => import("./TrainerTimer").then(mod => mod.TrainerTimer), { ssr: false });
const TrainerPulse = dynamic(() => import("./TrainerPulse").then(mod => mod.TrainerPulse), { ssr: false });
const TrainerMapping = dynamic(() => import("./TrainerMapping").then(mod => mod.TrainerMapping), { ssr: false });
const TrainerForm = dynamic(() => import("./TrainerForm").then(mod => mod.TrainerForm), { ssr: false });
const TrainerEmbed = dynamic(() => import("./TrainerEmbed").then(mod => mod.TrainerEmbed), { ssr: false });
const TrainerDocument = dynamic(() => import("./TrainerDocument").then(mod => mod.TrainerDocument), { ssr: false });
const MonacoLiveEditor = dynamic(() => import("./MonacoLiveEditor").then(mod => mod.MonacoLiveEditor), { ssr: false });

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
  document: TrainerDocument,
  code: (props) => {
    const config = props.module.config as ModuleConfig;
    return (
      <div className="h-full w-full p-4 md:p-6 bg-gray-900">
        <MonacoLiveEditor
          language={config.codeLanguage || "javascript"}
          initialCode={config.initialCode || ""}
          value={config.initialCode || ""}
          onChange={() => {}}
          prompt={config.codePrompt}
          readonly={true}
        />
      </div>
    );
  },
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
