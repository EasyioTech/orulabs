"use client";

import Link from "next/link";
import { useSharedTrainings } from "@/hooks/useTrainings";
import { cn } from "@oruclass/utils";
import { SafeHTML } from "@/components/ui/SafeHTML";
import { Users } from "lucide-react";
import type { Training, TrainingRole } from "@oruclass/types";

const ROLE_LABELS: Record<TrainingRole, string> = {
  lead_trainer: "Lead Trainer",
  full_editor: "Full Editor",
  partial_editor: "Partial Editor",
  facilitation_support: "Support",
};

const ROLE_COLORS: Record<TrainingRole, string> = {
  lead_trainer: "bg-brand-50 text-brand-700 border-brand-100",
  full_editor: "bg-emerald-50 text-emerald-700 border-emerald-100",
  partial_editor: "bg-blue-50 text-blue-700 border-blue-100",
  facilitation_support: "bg-gray-100 text-gray-600 border-gray-100",
};

function SharedTrainingCard({ t }: { t: Training & { myRole: TrainingRole } }) {
  const canEdit = t.myRole === "lead_trainer" || t.myRole === "full_editor";

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col h-full">
      <div className="p-6 bg-white flex-1">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {t.labels?.map((label, idx) => (
              <span key={idx} className="px-2.5 py-0.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-100">
                {label}
              </span>
            ))}
            <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-100">
              {(t as { days?: unknown[] }).days?.length ?? 0} Days
            </span>
          </div>
          <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full border shrink-0", ROLE_COLORS[t.myRole])}>
            {ROLE_LABELS[t.myRole]}
          </span>
        </div>
        <h3 className="text-base font-semibold text-gray-900 leading-snug mb-1 group-hover:text-brand-700 transition-colors">{t.title}</h3>
        {t.description && <SafeHTML html={t.description} className="text-sm text-gray-500 line-clamp-2 leading-relaxed mt-1" />}
      </div>
      <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-t border-gray-100 mt-auto">
        {canEdit ? (
          <Link
            href={`/trainings/${t.id}/studio`}
            className="text-sm px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
          >
            Open Studio
          </Link>
        ) : (
          <Link
            href={`/trainings/${t.id}/studio`}
            className="text-sm px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            View Session
          </Link>
        )}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Users size={13} />
          <span>Shared with you</span>
        </div>
      </div>
    </div>
  );
}

export default function SharedWithMePage() {
  const { data: trainings, isLoading } = useSharedTrainings();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Users size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shared with me</h1>
          <p className="text-sm text-gray-500 mt-0.5">Trainings where you&apos;ve been invited as a facilitator.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-56 animate-pulse" />
          ))}
        </div>
      ) : !trainings || trainings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
            <Users size={28} className="text-gray-300" />
          </div>
          <p className="text-base font-semibold text-gray-700">No shared trainings yet</p>
          <p className="text-sm text-gray-400 mt-1 max-w-xs">
            When someone invites you as a facilitator, their training will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {trainings.map((t) => (
            <SharedTrainingCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
