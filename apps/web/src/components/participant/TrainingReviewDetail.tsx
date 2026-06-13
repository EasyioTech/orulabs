"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, FileText, StickyNote, Award, Calendar, User } from "lucide-react";
import { SafeHTML } from "@/components/ui/SafeHTML";
import { cn } from "@oruclass/utils";
import { useParticipantTrainingReview } from "@/hooks/useParticipant";
import { useAuth } from "@/hooks/useAuth";
import { ModuleResponseCard } from "./ModuleResponseCard";
import { TrainingCertificate } from "./TrainingCertificate";

type Tab = "overview" | "modules" | "notes" | "certificate";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "modules", label: "Modules", icon: FileText },
  { id: "notes", label: "My Notes", icon: StickyNote },
  { id: "certificate", label: "Certificate", icon: Award },
];

export function TrainingReviewDetail({ trainingId }: { trainingId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, error } = useParticipantTrainingReview(trainingId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-600 font-medium">Unable to load training review.</p>
        <button
          onClick={() => router.push("/participant/previous")}
          className="mt-3 text-sm text-brand-600 hover:underline"
        >
          Back to Previous Sessions
        </button>
      </div>
    );
  }

  const { training, responses, personalNotes, joinedAt } = data;
  const responseMap = new Map(responses.map((r) => [r.moduleId, r]));

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <button
          onClick={() => router.push("/participant/previous")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Previous Sessions
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{training.title}</h1>
        {training.description && (
          <SafeHTML html={training.description} className="text-sm text-gray-500 mt-1" />
        )}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
          {training.creator && (
            <span className="flex items-center gap-1">
              <User size={12} /> {training.creator.name}
            </span>
          )}
          {joinedAt && (
            <span className="flex items-center gap-1">
              <Calendar size={12} /> Joined {new Date(joinedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
            Completed
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 shadow-sm overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Training Info */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Training Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Type</p>
                  <p className="text-gray-700 capitalize">{training.type?.replace("_", " ") || "In person"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Modules</p>
                  <p className="text-gray-700">{training.modules?.length || 0} modules</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Your Submissions</p>
                  <p className="text-gray-700">{responses.length} of {training.modules?.length || 0}</p>
                </div>
                {training.labels && training.labels.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Labels</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {training.labels.map((label: string) => (
                        <span key={label} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{label}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Facilitators */}
            {training.facilitators && training.facilitators.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Facilitators</h3>
                <div className="space-y-2">
                  {training.facilitators.map((f) => {
                    const u = f.user;
                    return (
                      <div key={u.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{f.role.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Days */}
            {training.days && training.days.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Training Schedule</h3>
                <div className="space-y-2">
                  {training.days.map((day) => (
                    <div key={day.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {day.dayNumber}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{day.title}</p>
                        {day.date && (
                          <p className="text-xs text-gray-400">
                            {new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "modules" && (
          <div className="space-y-3">
            {!training.modules?.length ? (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm">No modules in this training.</p>
              </div>
            ) : (
              training.modules.map((mod) => (
                <ModuleResponseCard
                  key={mod.id}
                  module={mod}
                  response={responseMap.get(mod.id)}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Personal Notes</h3>
            {personalNotes ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{personalNotes}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No notes were taken during this training.</p>
            )}
          </div>
        )}

        {activeTab === "certificate" && (
          <TrainingCertificate data={data} userName={user?.name || "Participant"} />
        )}
      </div>
    </div>
  );
}
