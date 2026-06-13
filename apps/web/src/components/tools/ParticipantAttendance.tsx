"use client";

import { useState } from "react";
import { useResponseSubmit } from "@/hooks/useResponseSubmit";
import { useAuthStore } from "@/store/auth";
import type { TrainingModule, AttendanceField } from "@oruclass/types";
import { ClipboardList, CheckCircle2 } from "lucide-react";

interface Props {
  module: TrainingModule;
  trainingId: string;
}

export function ParticipantAttendance({ module, trainingId }: Props) {
  const { submit: submitResponse } = useResponseSubmit(trainingId);
  const user = useAuthStore((s) => s.user);
  const fields: AttendanceField[] = (module.config.attendanceFields as AttendanceField[]) ?? [];

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = { name: user?.name ?? "" };
    fields.forEach((f) => { init[f.id] = ""; });
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Name is required";
    fields.forEach((f) => {
      if (f.required && !values[f.id]?.trim()) {
        next[f.id] = `${f.label} is required`;
      }
      if (f.type === "email" && values[f.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[f.id])) {
        next[f.id] = "Invalid email address";
      }
      if (f.type === "tel" && values[f.id] && !/^[+\d\s\-()]{7,}$/.test(values[f.id])) {
        next[f.id] = "Invalid phone number";
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setIsPending(true);
    await submitResponse(module.id, { type: "attendance", fields: values });
    setSubmitted(true);
    setIsPending(false);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-16 h-16 rounded-xl bg-green-50 border-2 border-green-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">Attendance recorded!</p>
          <p className="text-sm text-gray-500 mt-1">Welcome, {values.name}. Wait for the trainer to start.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
          <ClipboardList size={20} className="text-brand-600" />
        </div>
        <div>
          <h2 className="text-[17px] font-bold text-gray-900">{module.title}</h2>
          <p className="text-[12px] text-gray-400">Fill in your details to mark attendance</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Name — always present, pre-filled */}
        <div>
          <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
              errors.name ? "border-red-300 bg-red-50" : "border-gray-100 bg-white"
            }`}
            placeholder="Your full name"
          />
          {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Dynamic fields from config */}
        {fields.map((field) => (
          <div key={field.id}>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {field.type === "select" && field.options?.length ? (
              <select
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors bg-white ${
                  errors[field.id] ? "border-red-300 bg-red-50" : "border-gray-100"
                }`}
              >
                <option value="">Select…</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                value={values[field.id] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
                  errors[field.id] ? "border-red-300 bg-red-50" : "border-gray-100 bg-white"
                }`}
                placeholder={field.label}
              />
            )}
            {errors[field.id] && (
              <p className="text-[11px] text-red-500 mt-1">{errors[field.id]}</p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={submit}
        disabled={isPending}
        className="w-full mt-6 py-3 bg-brand-600 text-white rounded-xl font-semibold text-sm hover:bg-brand-700 active:scale-[.99] transition-all disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Mark Attendance"}
      </button>
    </div>
  );
}
