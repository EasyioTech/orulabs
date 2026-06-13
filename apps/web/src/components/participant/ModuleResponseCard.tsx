"use client";

import type { TrainingModule, ParticipantResponse, ResponseData } from "@oruclass/types";
import {
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  BarChart3,
  Cloud,
  HelpCircle,
  Heart,
  Map,
  ClipboardList,
  ExternalLink,
  Users,
  Timer,
  Pen,
} from "lucide-react";

const moduleIcons: Record<string, React.ElementType> = {
  quiz: CheckCircle,
  reflection: MessageSquare,
  whiteboard: Pen,
  matrix: BarChart3,
  poll: BarChart3,
  wordcloud: Cloud,
  qna: HelpCircle,
  pulse: Heart,
  mapping: Map,
  form: ClipboardList,
  embed: ExternalLink,
  attendance: Users,
  timer: Timer,
  custom: FileText,
};

function ResponseContent({ module, response }: { module: TrainingModule; response?: ParticipantResponse }) {
  if (!response) {
    return <p className="text-sm text-gray-400 italic">No response submitted</p>;
  }

  const data = response.responseData as ResponseData;

  switch (data.type) {
    case "quiz": {
      const questions = module.config.questions || [];
      return (
        <div className="space-y-3">
          {questions.map((q) => {
            const answer = data.answers[q.id];
            const isCorrect = q.correctAnswer && answer === q.correctAnswer;
            const hasCorrectAnswer = !!q.correctAnswer;
            return (
              <div key={q.id} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-1">{q.text}</p>
                <div className="flex items-center gap-2">
                  {hasCorrectAnswer && (
                    isCorrect
                      ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                      : <XCircle size={14} className="text-red-400 flex-shrink-0" />
                  )}
                  <span className="text-sm text-gray-600">
                    {answer || "—"}
                  </span>
                </div>
                {hasCorrectAnswer && !isCorrect && q.correctAnswer && (
                  <p className="text-xs text-gray-400 mt-1">Correct: {q.correctAnswer}</p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    case "reflection":
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          {module.config.prompt && (
            <p className="text-xs font-medium text-gray-400 mb-2">{module.config.prompt}</p>
          )}
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.text}</p>
        </div>
      );

    case "poll":
      return (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-400 mb-2">{module.config.pollQuestion}</p>
          {data.selected.map((opt) => (
            <div key={opt} className="flex items-center gap-2 bg-brand-50 rounded-lg px-3 py-1.5">
              <CheckCircle size={12} className="text-brand-500" />
              <span className="text-sm text-gray-700">{opt}</span>
            </div>
          ))}
        </div>
      );

    case "wordcloud":
      return (
        <div className="flex flex-wrap gap-2">
          {data.words.map((word, i) => (
            <span key={i} className="bg-brand-50 text-brand-700 text-sm px-3 py-1 rounded-full">
              {word}
            </span>
          ))}
        </div>
      );

    case "matrix": {
      const rows = module.config.rows || [];
      const columns = module.config.columns || [];
      return (
        <div className="overflow-x-auto">
          <table className="text-sm w-full">
            <thead>
              <tr>
                <th className="text-left text-gray-400 font-medium p-2" />
                {columns.map((col) => (
                  <th key={col} className="text-left text-gray-500 font-medium p-2 text-xs">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row} className="border-t border-gray-100">
                  <td className="text-gray-600 font-medium p-2 text-xs">{row}</td>
                  {columns.map((col) => {
                    const key = `${row}::${col}`;
                    return (
                      <td key={col} className="p-2 text-gray-700 text-xs">
                        {data.cells[key] || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "qna":
      return (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">{data.question}</p>
        </div>
      );

    case "pulse":
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl">{data.emoji}</span>
        </div>
      );

    case "mapping": {
      const areas = module.config.mappingFocusAreas || [];
      return (
        <div className="space-y-3">
          {areas.map((area) => (
            <div key={area.id} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">{area.title}</p>
              <div className="space-y-1">
                {(data.answers[area.id] || []).map((ans, i) => (
                  <p key={i} className="text-sm text-gray-700">• {ans}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "form": {
      const fields = module.config.formFields || [];
      return (
        <div className="space-y-2">
          {fields.map((field) => {
            const answer = data.answers[field.id];
            return (
              <div key={field.id} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-400 mb-1">{field.label}</p>
                <p className="text-sm text-gray-700">
                  {Array.isArray(answer) ? answer.join(", ") : answer || "—"}
                </p>
              </div>
            );
          })}
        </div>
      );
    }

    case "attendance":
      return (
        <div className="space-y-1">
          {Object.entries(data.fields).map(([key, val]) => (
            <div key={key} className="flex gap-2 text-sm">
              <span className="text-gray-400 capitalize">{key}:</span>
              <span className="text-gray-700">{val}</span>
            </div>
          ))}
        </div>
      );

    case "embed":
      return (
        <p className="text-sm text-gray-500">
          {data.viewed ? "Viewed" : "Not viewed"}
        </p>
      );

    case "whiteboard":
      return (
        <p className="text-sm text-gray-500 italic">
          Whiteboard submission ({data.strokes.length} stroke{data.strokes.length !== 1 ? "s" : ""})
        </p>
      );

    default:
      return <p className="text-sm text-gray-400 italic">Response type not supported for review</p>;
  }
}

export function ModuleResponseCard({ module, response }: { module: TrainingModule; response?: ParticipantResponse }) {
  const Icon = moduleIcons[module.moduleType] || FileText;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-brand-500" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">{module.title}</h4>
          <p className="text-xs text-gray-400 capitalize">{module.moduleType.replace("_", " ")}</p>
        </div>
        {response && (
          <span className="ml-auto text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full flex-shrink-0">
            Submitted
          </span>
        )}
      </div>
      <ResponseContent module={module} response={response} />
    </div>
  );
}
