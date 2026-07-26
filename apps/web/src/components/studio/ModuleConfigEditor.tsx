import React from "react";
import type { TrainingModule, ModuleConfig } from "@oruclass/types";
import { QuizEditor } from "./modules/QuizEditor";
import { ReflectionEditor } from "./modules/ReflectionEditor";
import { MatrixEditor } from "./modules/MatrixEditor";
import { WhiteboardEditor } from "./modules/WhiteboardEditor";
import { AttendanceEditor } from "./modules/AttendanceEditor";
import { CustomEditor } from "./modules/CustomEditor";
import { PollEditor } from "./modules/PollEditor";
import { WordcloudEditor } from "./modules/WordcloudEditor";
import { QnaEditor } from "./modules/QnaEditor";
import { TimerEditor } from "./modules/TimerEditor";
import { PulseEditor } from "./modules/PulseEditor";
import { MappingEditor } from "./modules/MappingEditor";
import { FormEditor } from "./modules/FormEditor";
import { EmbedEditor } from "./modules/EmbedEditor";
import { CodeEditor } from "./modules/CodeEditor";
import { DocumentEditor } from "./modules/DocumentEditor";


const registry: Record<string, React.FC<any>> = {
  "quiz": QuizEditor,
  "reflection": ReflectionEditor,
  "matrix": MatrixEditor,
  "whiteboard": WhiteboardEditor,
  "attendance": AttendanceEditor,
  "custom": CustomEditor,
  "poll": PollEditor,
  "wordcloud": WordcloudEditor,
  "qna": QnaEditor,
  "timer": TimerEditor,
  "pulse": PulseEditor,
  "mapping": MappingEditor,
  "form": FormEditor,
  "embed": EmbedEditor,
  "code": CodeEditor,
  "document": DocumentEditor,
};


export function ModuleConfigEditor({
  module,
  config,
  onChange,
}: {
  module: TrainingModule;
  config: ModuleConfig;
  onChange: (c: ModuleConfig) => void;
}) {
  const Component = registry[module.moduleType];
  if (!Component) {
    return <div className="p-4 text-sm text-gray-500">No configuration available for {module.moduleType}</div>;
  }
  return <Component module={module} config={config} onChange={onChange} />;
}
