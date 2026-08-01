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

import { DeleteTrainingModal, EditTrainingModal } from "./WorkspaceModals";

function RestoreTrainingCard({ t }: { t: Training }) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const restoreTraining = useRestoreTraining(workspaceId);

  return (
    <div className="bg-white rounded-lg border border-[#dadce0] flex flex-col overflow-hidden opacity-70 h-[280px]">
      <div className="h-28 bg-[#f1f3f4] flex-shrink-0 flex flex-col justify-end p-4">
        <h3 className="text-xl font-medium text-gray-700 leading-tight truncate">{t.title}</h3>
        <p className="text-sm text-gray-500 truncate mt-0.5">{t.days?.length || 0} days · Deleted</p>
      </div>
      <div className="p-4 flex-1 flex flex-col bg-white">
        {t.labels && t.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {t.labels.map((label, idx) => (
              <span key={idx} className="px-2.5 py-0.5 bg-[#f1f3f4] text-gray-700 text-[11px] font-medium rounded-full">{label}</span>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 py-3 border-t border-[#dadce0] bg-white flex justify-end">
        <button
          onClick={() => restoreTraining.mutate(t.id)}
          disabled={restoreTraining.isPending}
          className="px-4 py-2 text-[#1a73e8] hover:bg-blue-50/50 rounded-md transition-colors text-sm font-medium"
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
      <div className="bg-white rounded-lg border border-[#dadce0] hover:shadow-sm transition-all duration-200 group flex flex-col overflow-hidden h-[320px]">
        {/* Colored banner */}
        <div
          className="h-28 relative flex-shrink-0 p-4 flex flex-col justify-end"
          style={{ backgroundColor: bannerColor(t.id) }}
        >
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(true); }}
              className="p-2 hover:bg-black/20 text-white rounded-full transition-colors"
              title="Edit training"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsDeleteModalOpen(true); }}
              className="p-2 hover:bg-black/20 text-white rounded-full transition-colors"
              title="Delete training"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <h3 className="text-xl font-medium text-white leading-tight truncate">{t.title}</h3>
          <p className="text-sm text-white/90 truncate mt-0.5">{t.days?.length || 0} days</p>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col bg-white">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <span className={cn("w-2 h-2 rounded-full", ["live", "connecting"].includes(t.sessionStatus) ? "bg-green-500 animate-pulse" : "bg-gray-300")} />
              {t.sessionStatus}
            </span>
          </div>
          {t.description && (
            <SafeHTML html={t.description} className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3" />
          )}
          {t.labels && t.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
              {t.labels.map((label, idx) => (
                <span key={idx} className="px-2.5 py-0.5 bg-[#f1f3f4] text-[#3c4043] text-[11px] font-medium rounded-full">
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#dadce0] flex items-center justify-between bg-white">
          <div className="flex gap-2">
            {["live", "connecting", "paused"].includes(t.sessionStatus) ? (
              <>
                <Link
                  href={`/trainings/${t.id}/live`}
                  className="text-xs px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium shadow-sm flex items-center gap-1.5"
                >
                  <Play size={12} />
                  Join Session
                </Link>
                <Link
                  href={`/trainings/${t.id}/studio`}
                  className="text-xs px-3 py-2 text-gray-600 rounded-md hover:bg-gray-100 transition-colors font-medium"
                  title="Open Studio"
                >
                  Studio
                </Link>
              </>
            ) : (
              <Link
                href={`/trainings/${t.id}/studio`}
                data-tour={index === 0 ? "open-studio" : undefined}
                className="text-xs px-4 py-2 text-[#1a73e8] hover:bg-blue-50/50 rounded-md transition-colors font-medium"
              >
                Open Studio
              </Link>
            )}
          </div>
          <Link
            href={`/trainings/${t.id}/analytics`}
            data-tour={index === 0 ? "analytics" : undefined}
            className="text-xs px-3 py-2 text-gray-500 hover:text-[#1a73e8] hover:bg-gray-50 rounded-md transition-colors font-medium flex items-center gap-1"
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
              className="flex items-center gap-2 px-5 py-3 bg-white text-gray-700 rounded-full hover:bg-[#f8f9fa] shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] hover:shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] transition-all text-sm font-medium ml-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z" fill="#1a73e8"/>
              </svg>
              New
            </Link>
          )}
        </div>
      </div>

      {showTrash ? (
        trashLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !trash?.length ? (
          <div className="bg-white rounded-lg border border-[#dadce0] p-12 text-center">
            <div className="w-16 h-16 bg-[#f1f3f4] rounded-full mx-auto flex items-center justify-center mb-4">
              <Trash2 size={24} className="text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Trash is empty</h3>
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
          <div className="w-6 h-6 border-4 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !trainings?.length ? (
        <div className="bg-white rounded-lg border border-[#dadce0] p-12 text-center">
          <div className="w-16 h-16 bg-[#f1f3f4] rounded-full mx-auto flex items-center justify-center mb-4">
            <LayoutGrid size={24} className="text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No trainings yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first training to start building day-wise plans.</p>
          <Link
            href="/trainings/new"
            data-tour="new-training"
            className="px-6 py-2 bg-[#1a73e8] text-white rounded-md hover:bg-[#1557b0] shadow-sm transition-colors text-sm font-medium inline-flex"
          >
            Create
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
