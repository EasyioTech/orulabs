"use client";

import { useRef } from "react";
import { format } from "date-fns";
import { SafeHTML } from "@/components/ui/SafeHTML";
import { Download, Award } from "lucide-react";
import type { TrainingReviewData } from "@/hooks/useParticipant";

interface Props {
  data: TrainingReviewData;
  userName: string;
}

export function TrainingCertificate({ data, userName }: Props) {
  const certRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const { training, joinedAt } = data;
  const startDate = training.startDate || joinedAt;
  const endDate = training.endDate || training.updatedAt;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Certificate of Completion</h3>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors print:hidden"
        >
          <Download size={14} />
          Download PDF
        </button>
      </div>

      <div
        ref={certRef}
        className="bg-white border-2 border-gray-100 rounded-xl p-8 sm:p-12 text-center print:border-0 print:shadow-none"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-brand-50 flex items-center justify-center">
            <Award size={32} className="text-brand-500" />
          </div>
        </div>

        <p className="text-xs uppercase tracking-[0.15em] text-gray-400 font-semibold mb-2">
          Certificate of Completion
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          {userName}
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          has successfully completed the training
        </p>

        <div className="bg-gray-50 rounded-xl px-6 py-4 inline-block mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{training.title}</h3>
          {training.description && (
            <SafeHTML html={training.description} className="text-sm text-gray-500 mt-1 max-w-md" />
          )}
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
          {startDate && (
            <div>
              <p className="text-xs text-gray-400">Started</p>
              <p className="font-medium text-gray-700">
                {new Date(startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          )}
          {endDate && (
            <div>
              <p className="text-xs text-gray-400">Completed</p>
              <p className="font-medium text-gray-700">
                {new Date(endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          )}
        </div>

        {training.creator && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">Trainer</p>
            <p className="text-sm font-medium text-gray-700">{training.creator.name}</p>
          </div>
        )}

        <p className="mt-8 text-[10px] text-gray-300">
          Issued by OruLabs • orulabs.in
        </p>
      </div>
    </div>
  );
}
