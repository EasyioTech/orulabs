"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import { useIsTimeUp } from "@/hooks/useIsTimeUp";
import type { TrainingModule, FormField } from "@oruclass/types";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantForm({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const isTimeUp = useIsTimeUp();
  const fields = module.config.formFields ?? [];
  const title = module.config.formTitle ?? module.title;
  const description = module.config.formDescription;

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (fieldId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error if exists
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[fieldId];
        return newErrs;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required) {
        const val = answers[field.id];
        if (
          val === undefined ||
          val === null ||
          (typeof val === "string" && val.trim() === "") ||
          (Array.isArray(val) && val.length === 0)
        ) {
          newErrors[field.id] = "This field is required";
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setIsPending(true);
    await submitResponse(module.id, { type: "form", answers });
    setSubmitted(true);
    setIsPending(false);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <div className="text-4xl">✅</div>
          <p className="font-medium text-gray-700">Form submitted successfully!</p>
        </div>
      </div>
    );
  }

  const renderField = (field: FormField) => {
    const val = answers[field.id];
    const hasError = !!errors[field.id];

    switch (field.type) {
      case "short_text":
      case "date":
      case "time":
        return (
          <input
            type={field.type === "short_text" ? "text" : field.type}
            value={(val as string) || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
          />
        );
      case "long_text":
        return (
          <textarea
            rows={4}
            value={(val as string) || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm resize-none ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
          />
        );
      case "multiple_choice":
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={val === opt}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );
      case "checkboxes":
        const arrVal = (val as string[]) || [];
        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  value={opt}
                  checked={arrVal.includes(opt)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (checked) {
                      handleInputChange(field.id, [...arrVal, opt]);
                    } else {
                      handleInputChange(field.id, arrVal.filter(item => item !== opt));
                    }
                  }}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );
      case "dropdown":
        return (
          <select
            value={(val as string) || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm bg-white ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
          >
            <option value="" disabled>Select an option...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default:
        return <div className="text-sm text-red-500">Unsupported field type: {field.type}</div>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto h-full overflow-y-auto pb-24">
      <div className="space-y-2 border-b pb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description && <p className="text-gray-600">{description}</p>}
      </div>

      {fields.length === 0 ? (
        <div className="text-center p-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-100">
          No form fields configured.
        </div>
      ) : (
        <div className="space-y-8">
          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {field.description && (
                <p className="text-xs text-gray-500 pb-1">{field.description}</p>
              )}
              {renderField(field)}
              {errors[field.id] && (
                <p className="text-xs text-red-500 mt-1">{errors[field.id]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {fields.length > 0 && (
        <div className="pt-6 border-t">
          <button
            onClick={submit}
            disabled={isPending || isTimeUp}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isTimeUp ? "Time's up!" : isPending ? "Submitting..." : "Submit Form"}
          </button>
        </div>
      )}
    </div>
  );
}
