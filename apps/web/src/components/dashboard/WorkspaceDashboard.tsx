"use client";

import Link from "next/link";
import { useWorkspaces, useCreateWorkspace } from "@/hooks/useWorkspace";
import { useTrainings, useTrash, useRestoreTraining } from "@/hooks/useTrainings";
import { useWorkspaceStore } from "@/store/workspace";
import { useAuthStore } from "@/store/auth";
import { useSubscriptionStore } from "@/store/subscription";
import { formatDate } from "@oruclass/utils";
import { cn } from "@oruclass/utils";

import { useRouter } from "next/navigation";

import { ChevronDown, ChevronUp, Trash2, CalendarDays, Play, ArrowRight, LayoutGrid, Pencil, X, Check, HelpCircle } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useOnboardingTour } from "@/hooks/useOnboardingTour";
import type { DriveStep } from "driver.js";
import { getPlan } from "@/config/plans";
import type { Training } from "@oruclass/types";
import { useDeleteTraining, useUpdateTraining } from "@/hooks/useTrainings";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { SafeHTML } from "@/components/ui/SafeHTML";

// Deterministic banner color from training ID
const BANNER_COLORS = ["#1565C0","#00695C","#2E7D32","#6A1B9A","#E65100","#AD1457","#283593","#00838F"];
function bannerColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return BANNER_COLORS[Math.abs(h) % BANNER_COLORS.length];
}

function DeleteTrainingModal({ isOpen, onClose, training, onDelete }: { isOpen: boolean, onClose: () => void, training: Training, onDelete: () => void }) {
  const [input, setInput] = useState("");
  const isMatch = input === training.title;

  useEffect(() => {
    if (!isOpen) setInput("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Training</h3>
        <p className="text-gray-600 mb-6 text-sm">
          Move <strong>{training.title}</strong> to trash? You can restore it later from the trash folder.
        </p>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please type <strong>{training.title}</strong> to confirm.
          </label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
            placeholder={training.title}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
            Cancel
          </button>
          <button
            disabled={!isMatch}
            onClick={() => { if (isMatch) onDelete(); }}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Delete Training
          </button>
        </div>
      </div>
    </div>
  );
}

const TYPES: { value: string; label: string }[] = [
  { value: "in_person", label: "In-Person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

function EditTrainingModal({ isOpen, onClose, training }: { isOpen: boolean; onClose: () => void; training: Training }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const updateTraining = useUpdateTraining(workspaceId, training.id);
  const [title, setTitle] = useState(training.title);
  const [labels, setLabels] = useState(training.labels?.join(", ") ?? "");
  const [type, setType] = useState(training.type || "in_person");
  const [description, setDescription] = useState(training.description ?? "");
  const [venue, setVenue] = useState(training.venue ?? "");
  const [meetingLink, setMeetingLink] = useState(training.meetingLink ?? "");
  const [startDate, setStartDate] = useState(
    training.startDate ? new Date(training.startDate).toISOString().split("T")[0] : ""
  );
  const [endDate, setEndDate] = useState(
    training.endDate ? new Date(training.endDate).toISOString().split("T")[0] : ""
  );

  useEffect(() => {
    if (isOpen) {
      setTitle(training.title);
      setLabels(training.labels?.join(", ") ?? "");
      setType(training.type || "in_person");
      setDescription(training.description ?? "");
      setVenue(training.venue ?? "");
      setMeetingLink(training.meetingLink ?? "");
      setStartDate(training.startDate ? new Date(training.startDate).toISOString().split("T")[0] : "");
      setEndDate(training.endDate ? new Date(training.endDate).toISOString().split("T")[0] : "");
    }
  }, [isOpen, training]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateTraining.mutate(
      {
        title: title.trim(),
        labels: labels ? labels.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        type: type as "in_person" | "online" | "hybrid",
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg animate-in fade-in zoom-in duration-200 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Edit Training</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X size={18} /></button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Labels (comma separated)</label>
            <input
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="e.g. tech, leadership"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Optional description…"
            minHeight="120px"
          />
          <div className="flex justify-end mt-1">
            <span className={cn("text-xs font-medium", description.replace(new RegExp("<[^>]*>?", "gm"), '').length > 2000 ? "text-red-500" : "text-gray-500")}>
              {description.replace(new RegExp("<[^>]*>?", "gm"), '').length} / 2000 characters
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">Moving the start date shifts existing days to match.</p>
          </div>
        </div>
        {(type === "in_person" || type === "hybrid") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue Location</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Conference Room A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}
        {(type === "online" || type === "hybrid") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Virtual Meeting Link</label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="e.g. https://zoom.us/j/123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}
        {updateTraining.isError && (
          <p className="text-sm text-red-500">Failed to update training. Try again.</p>
        )}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateTraining.isPending || !title.trim()}
            className="flex-1 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {updateTraining.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RestoreTrainingCard({ t }: { t: Training }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const restoreTraining = useRestoreTraining(workspaceId);

  return (
    <div className="bg-white rounded-2xl border border-[#dadce0] shadow-sm flex flex-col overflow-hidden opacity-70">
      <div className="h-32 bg-gray-200 flex-shrink-0" />
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-[17px] font-bold text-gray-700 leading-snug mb-1">{t.title}</h3>
        <p className="text-xs text-gray-400 mb-3">{t.days?.length || 0} days · Deleted</p>
        {t.labels && t.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {t.labels.map((label, idx) => (
              <span key={idx} className="px-3 py-1 bg-[#f1f3f4] text-gray-700 text-[11px] font-medium rounded-full">{label}</span>
            ))}
          </div>
        )}
      </div>
      <div className="px-5 py-4 border-t border-gray-100">
        <button
          onClick={() => restoreTraining.mutate(t.id)}
          disabled={restoreTraining.isPending}
          className="w-full py-2 bg-[#1a73e8] text-white rounded-md hover:bg-[#1557b0] disabled:opacity-60 transition-colors text-sm font-medium shadow-sm"
        >
          {restoreTraining.isPending ? "Restoring…" : "Restore"}
        </button>
      </div>
    </div>
  );
}

function TrainingCard({ t, index }: { t: Training; index: number }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const deleteTraining = useDeleteTraining(workspaceId);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const confirmDelete = () => {
    deleteTraining.mutate(t.id);
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#dadce0] hover:border-[#1a73e8] hover:shadow-md transition-all duration-200 group flex flex-col overflow-hidden">
        {/* Colored banner */}
        <div
          className="h-32 relative flex-shrink-0"
          style={{ backgroundColor: bannerColor(t.id) }}
        >
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }}
              className="p-1.5 bg-black/20 hover:bg-black/35 text-white rounded-lg transition-colors"
              title="Edit training"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsDeleteModalOpen(true); }}
              className="p-1.5 bg-black/20 hover:bg-black/35 text-white rounded-lg transition-colors"
              title="Delete training"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-[17px] font-bold text-gray-900 leading-snug mb-1.5">{t.title}</h3>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs text-gray-500">{t.days?.length || 0} days</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block flex-shrink-0" />
              {t.sessionStatus}
            </span>
          </div>
          {t.description && (
            <SafeHTML html={t.description} className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3 flex-1" />
          )}
          {t.labels && t.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
              {t.labels.map((label, idx) => (
                <span key={idx} className="px-3 py-1 bg-[#f1f3f4] text-gray-700 text-[11px] font-medium rounded-full">
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <Link
            href={`/trainings/${t.id}/studio`}
            data-tour={index === 0 ? "open-studio" : undefined}
            className="text-xs px-5 py-2 bg-[#1a73e8] text-white rounded-md hover:bg-[#1557b0] transition-colors font-medium shadow-sm"
          >
            Open Studio
          </Link>
          <Link
            href={`/trainings/${t.id}/analytics`}
            data-tour={index === 0 ? "analytics" : undefined}
            className="text-xs text-gray-400 font-medium hover:text-[#1a73e8] flex items-center gap-1 transition-colors"
          >
            Analytics <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <DeleteTrainingModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        training={t}
        onDelete={confirmDelete}
      />
      <EditTrainingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        training={t}
      />
    </>
  );
}


export function WorkspaceDashboard() {
  const router = useRouter();
  const { data: workspaces, isLoading } = useWorkspaces();
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: trainings, isLoading: trainingsLoading } = useTrainings(activeId ?? "");
  const { data: trash, isLoading: trashLoading } = useTrash(activeId ?? "");
  const { mutate: createWorkspace } = useCreateWorkspace();
  const user = useAuthStore((s) => s.user);
  const autoCreating = useRef(false);
  const [showTrash, setShowTrash] = useState(false);

  const { planId: subPlanId, status: subStatus } = useSubscriptionStore();
  const isPro = subStatus === "active";
  const currentPlan = subPlanId ? getPlan(subPlanId) : null;

  const hasTrainings = !!trainings?.length;
  const tourSteps = useMemo<DriveStep[]>(() => {
    const steps: DriveStep[] = [
      {
        popover: {
          title: "Welcome! 👋",
          description: "This is your dashboard. Here you build trainings and run them live. Quick look — takes 20 seconds.",
        },
      },
      {
        element: '[data-tour="new-training"]',
        popover: {
          title: "Make a training",
          description: "Tap here to start. You add your days and activities inside.",
        },
      },
    ];
    if (hasTrainings) {
      steps.push(
        {
          element: '[data-tour="open-studio"]',
          popover: {
            title: "Build your session",
            description: "Open Studio to add quizzes, polls, whiteboards and more. This is where you set everything up.",
          },
        },
        {
          element: '[data-tour="analytics"]',
          popover: {
            title: "See the results",
            description: "After the session, check here to see how everyone did.",
          },
        },
      );
    }
    return steps;
  }, [hasTrainings]);

  const tourReady = !isLoading && !trainingsLoading && !!user;
  const { startTour } = useOnboardingTour("trainer-dashboard-v1", tourSteps, tourReady);

  useEffect(() => {
    if (!isLoading && (!workspaces || workspaces.length === 0) && user && !autoCreating.current) {
      autoCreating.current = true;
      const firstName = user.name?.split(" ")[0] || "My";
      createWorkspace(`${firstName}'s Workspace`);
    }
  }, [isLoading, workspaces, user, createWorkspace]);

  if (isLoading || (!workspaces?.length && user)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Subscription banner moved to header */ }

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {showTrash ? "Trash" : "Trainings"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {showTrash ? "Restore deleted trainings." : "Select a day's session to start instantly."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={startTour}
            className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:text-[#1a73e8] text-sm font-medium transition-colors rounded-md hover:bg-gray-100"
            title="Show me around"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">Tour</span>
          </button>
          {!showTrash && trash && trash.length > 0 && (
            <button
              onClick={() => setShowTrash(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors border border-[#dadce0]"
            >
              <Trash2 size={15} />
              Trash ({trash.length})
            </button>
          )}
          {showTrash && (
            <button
              onClick={() => setShowTrash(false)}
              className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors border border-[#dadce0]"
            >
              Back
            </button>
          )}
          {!showTrash && trainings && trainings.length > 0 && (
            <Link
              href="/trainings/new"
              data-tour="new-training"
              className="px-5 py-2.5 bg-[#1a73e8] text-white rounded-md hover:bg-[#1557b0] shadow-sm transition-colors text-sm font-medium"
            >
              + New Training
            </Link>
          )}
        </div>
      </div>

      {showTrash ? (
        trashLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !trash?.length ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-100 p-12 text-center">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Trash is empty</h3>
            <p className="text-sm text-gray-500">Deleted trainings will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {trash.map((t) => (
              <RestoreTrainingCard key={t.id} t={t} />
            ))}
          </div>
        )
      ) : trainingsLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !trainings?.length ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-100 p-12 text-center">
          <h3 className="text-base font-semibold text-gray-900 mb-1">No trainings yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first training to start building day-wise plans.</p>
          <Link
            href="/trainings/new"
            data-tour="new-training"
            className="px-6 py-2.5 bg-[#1a73e8] text-white rounded-md hover:bg-[#1557b0] shadow-sm transition-colors text-sm font-medium inline-flex"
          >
            Create Training
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {trainings.map((t, i) => (
            <TrainingCard key={t.id} t={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
