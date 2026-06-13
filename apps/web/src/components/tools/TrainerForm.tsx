"use client";

import { useMemo, useState } from "react";
import { useModuleResponses } from "@/hooks/useModuleResponses";
import { useLiveSessionStore } from "@/store/liveSession";
import type { TrainingModule, FormField } from "@oruclass/types";
import { Users, FileText, ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function TrainerForm({ module, trainingId }: Props) {
  const { data: responses, isLoading } = useModuleResponses(trainingId, module.id);
  const fields = module.config.formFields ?? [];
  const title = module.config.formTitle ?? module.title;
  
  const participants = useLiveSessionStore((s) => s.participants);
  const joinedCount = useMemo(
    () => Array.from(participants.values()).filter((p) => p.role === "participant").length,
    [participants],
  );

  const responseList = responses ?? [];
  const respondedCount = responseList.length;
  const completionPct = joinedCount > 0 ? Math.round((respondedCount / joinedCount) * 100) : 0;

  const [expandedField, setExpandedField] = useState<string | null>(fields[0]?.id ?? null);

  // Extract answers per field
  const fieldAnswers = useMemo(() => {
    const map = new Map<string, { user: string; answer: string | string[] }[]>();
    for (const field of fields) {
      map.set(field.id, []);
    }

    for (const r of responseList) {
      const data = r.responseData;
      if (data?.type !== "form") continue;
      
      const userName = r.user?.name ?? "Anonymous";
      
      for (const [fieldId, val] of Object.entries(data.answers || {})) {
        if (!map.has(fieldId)) continue;
        if (val !== undefined && val !== null && val !== "") {
          map.get(fieldId)?.push({ user: userName, answer: val });
        }
      }
    }
    return map;
  }, [responseList, fields]);

  // Render a summary based on the field type
  const renderFieldSummary = (field: FormField) => {
    const answers = fieldAnswers.get(field.id) ?? [];
    
    if (answers.length === 0) {
      return <div className="text-sm italic text-gray-400 py-4 text-center">No responses yet.</div>;
    }

    if (field.type === "multiple_choice" || field.type === "dropdown" || field.type === "checkboxes") {
      // Calculate frequencies
      const frequencies: Record<string, number> = {};
      field.options?.forEach(opt => frequencies[opt] = 0);
      
      answers.forEach(a => {
        if (Array.isArray(a.answer)) {
          a.answer.forEach(val => {
            if (frequencies[val] !== undefined) frequencies[val]++;
          });
        } else {
          if (frequencies[a.answer as string] !== undefined) frequencies[a.answer as string]++;
        }
      });
      
      const maxFreq = Math.max(...Object.values(frequencies), 1);
      
      return (
        <div className="space-y-3 py-2">
          {field.options?.map((opt) => {
            const count = frequencies[opt] || 0;
            const pct = Math.round((count / Math.max(answers.length, 1)) * 100);
            return (
              <div key={opt} className="relative">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{opt}</span>
                  <span className="text-gray-500">{count} ({pct}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxFreq) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // For short_text, long_text, date, time
    return (
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 py-2">
        {answers.map((ans, idx) => (
          <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{ans.answer as string}</p>
            <p className="text-xs text-gray-400 mt-2 font-medium">- {ans.user}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">Review form submissions</p>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {respondedCount} / {joinedCount}
              </div>
              <div className="text-xs text-gray-500">Submitted</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{completionPct}%</div>
              <div className="text-xs text-gray-500">Completion</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center p-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-100">
            No form fields configured for this module.
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => {
              const isExpanded = expandedField === field.id;
              const ansCount = fieldAnswers.get(field.id)?.length ?? 0;
              
              return (
                <div key={field.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button 
                    onClick={() => setExpandedField(isExpanded ? null : field.id)}
                    className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{field.label}</h3>
                        <p className="text-xs text-gray-500 uppercase mt-0.5 tracking-wider">{field.type.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {ansCount} response{ansCount !== 1 ? 's' : ''}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="p-5 border-t border-gray-100 bg-white">
                      {renderFieldSummary(field)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
