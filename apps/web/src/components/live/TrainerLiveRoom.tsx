"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspace";
import { useAuthStore } from "@/store/auth";
import { useLiveSessionStore } from "@/store/liveSession";
import { useSocketSession } from "@/hooks/useSocket";
import type { TrainingRole } from "@oruclass/types";
import { useTraining, useMyTrainingRole } from "@/hooks/useTrainings";
import { useDays } from "@/hooks/useDays";
import { ParticipantGrid } from "./ParticipantGrid";
import { ControlPanel } from "./ControlPanel";
import { AgendaPane } from "./AgendaPane";
import { PulseMonitor } from "./PulseMonitor";
import { JoinSlide } from "./JoinSlide";
import { CompletedSlide } from "./CompletedSlide";
import { SelectModuleSlide } from "./SelectModuleSlide";
import { SelectDaySlide } from "./SelectDaySlide";
import { SessionDashboard } from "./SessionDashboard";
import { TrainerModuleRenderer } from "../tools/TrainerModuleRenderer";
import { ModuleStopwatch } from "./ModuleStopwatch";
import { cn } from "@oruclass/utils";
import { canDo } from "@/lib/permissions";
import {
  SlidersHorizontal,
  ListOrdered,
  Users,
  X,
  ArrowLeft,
  ChevronRight,
  BarChart2,
  WifiOff,
  RefreshCw,
  CalendarDays,
} from "lucide-react";

type RightTab = "control" | "agenda" | "participants" | "responses";

const TABS: { id: RightTab; label: string; Icon: React.ElementType }[] = [
  { id: "control", label: "Controls", Icon: SlidersHorizontal },
  { id: "agenda", label: "Agenda", Icon: ListOrdered },
  { id: "participants", label: "People", Icon: Users },
  { id: "responses", label: "Responses", Icon: BarChart2 },
];

export function TrainerLiveRoom({ trainingId }: { trainingId: string }) {
  const [rightOpen, setRightOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<RightTab>("control");

  const user = useAuthStore((s) => s.user);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const { data: training } = useTraining(activeWorkspaceId, trainingId);
  const { data: days = [] } = useDays(activeWorkspaceId, trainingId);
  const role = useMyTrainingRole(activeWorkspaceId, trainingId);

  // Day-wise go-live: ?dayId scopes the session to one day's modules.
  // "all" (or absent for single-day trainings) runs the whole training.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const dayParam = searchParams.get("dayId");
  const selectedDay =
    dayParam && dayParam !== "all" ? days.find((d) => d.id === dayParam) : null;

  const clearDay = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("dayId");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };
  const socket = useSocketSession(trainingId);
  const activeModule = useLiveSessionStore((s) => s.activeModule);
  const setActiveModule = useLiveSessionStore((s) => s.setActiveModule);
  const setSessionStats = useLiveSessionStore((s) => s.setSessionStats);
  const addParticipant = useLiveSessionStore((s) => s.addParticipant);
  const participants = useLiveSessionStore((s) => s.participants);
  const responseCounts = useLiveSessionStore((s) => s.responseCounts);
  const socketStatus = useLiveSessionStore((s) => s.socketStatus);

  const participantCount = Array.from(participants.values()).filter((p) => p.role === "participant").length;

  // Fallback sync: if socket event was missed but DB has an active module, restore state
  useEffect(() => {
    if (training?.sessionStatus !== "live") return;
    if (!training?.currentActiveModuleId) return;

    if (!activeModule || activeModule.id !== training.currentActiveModuleId) {
      const mod = training.modules?.find((m) => m.id === training.currentActiveModuleId);
      if (mod) setActiveModule(mod);
    }
  }, [training?.currentActiveModuleId, training?.sessionStatus, activeModule, training?.modules, setActiveModule]);

  useEffect(() => {
    if (!user || !trainingId || !socket) return;

    addParticipant({
      userId: user.id,
      name: user.name ?? "",
      role: "trainer",
      joinedAt: new Date().toISOString(),
      connectionStatus: "online",
    });

    const handleConnect = () => {
      socket.emit("participant:join", { trainingId, role: "trainer" });
    };

    if (socket.connected && training?.sessionStatus !== "draft" && training?.sessionStatus !== "completed") {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    // Handle session submission updates
    const handleSubmissionUpdate = (data: { submitted: number; totalParticipants: number; liveSessionId: string }) => {
      setSessionStats({
        submitted: data.submitted,
        totalParticipants: data.totalParticipants,
        completionPct: data.totalParticipants > 0 ? Math.round((data.submitted / data.totalParticipants) * 100) : 0,
        liveSessionId: data.liveSessionId,
      });
    };
    socket.on("session:submission_update", handleSubmissionUpdate);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("session:submission_update", handleSubmissionUpdate);
    };
  }, [user, trainingId, socket, training?.sessionStatus, setSessionStats]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!training) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  // Before opening a multi-day training for joining, make the trainer pick
  // which day to run. Skip once a day (or "all") is chosen, and never block a
  // session that's already past draft.
  const needsDayPick =
    training.sessionStatus === "draft" && days.length > 0 && !dayParam;

  const renderModuleArea = () => {
    if (training.sessionStatus === "completed") {
      return <CompletedSlide training={training} isTrainer={true} />;
    }
    if (needsDayPick) {
      return (
        <SelectDaySlide
          days={days}
          moduleCountForDay={(dayId) =>
            training.modules?.filter((m) => m.dayId === dayId).length ?? 0
          }
        />
      );
    }
    if (activeModule) {
      return <TrainerModuleRenderer key={activeModule.id} module={activeModule} trainingId={trainingId} />;
    }
    if (training.sessionStatus === "draft" || training.sessionStatus === "connecting") {
      return <JoinSlide training={training} trainingId={trainingId} isTrainer={true} />;
    }
    return <SelectModuleSlide training={training} isTrainer={true} />;
  };

  const statusConfig = (
    {
      live: { label: "Live", dot: "bg-green-500", pill: "bg-green-50 text-green-700 border-green-200" },
      connecting: { label: "Open", dot: "bg-blue-500", pill: "bg-blue-50 text-blue-700 border-blue-200" },
      paused: { label: "Paused", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700 border-amber-200" },
      draft: { label: "Draft", dot: "bg-gray-400", pill: "bg-gray-50 text-gray-500 border-gray-100" },
      completed: { label: "Ended", dot: "bg-gray-400", pill: "bg-gray-50 text-gray-500 border-gray-100" },
    } as Record<string, { label: string; dot: string; pill: string }>
  )[training.sessionStatus] ?? { label: training.sessionStatus, dot: "bg-gray-400", pill: "bg-gray-50 text-gray-500 border-gray-100" };

  return (
    <div className="flex h-full overflow-hidden bg-gray-50">
      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-4 flex-shrink-0 gap-3">
          {/* Left: back + training name */}
          <div className="flex items-center gap-3 min-w-0">
            <a
              href={`/trainings/${trainingId}/studio`}
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors shrink-0 group"
              title="Back to Studio"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-xs font-medium hidden sm:inline">Studio</span>
            </a>

            <div className="w-px h-5 bg-gray-200 shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-semibold text-gray-900 text-sm truncate">{training.title}</h2>
              {selectedDay && (
                <button
                  onClick={training.sessionStatus === "draft" ? clearDay : undefined}
                  disabled={training.sessionStatus !== "draft"}
                  title={training.sessionStatus === "draft" ? "Change day" : `Running Day ${selectedDay.dayNumber}`}
                  className={cn(
                    "flex items-center gap-1.5 shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    "bg-brand-50 border-brand-200 text-brand-700",
                    training.sessionStatus === "draft" ? "hover:bg-brand-100 transition-colors" : "cursor-default",
                  )}
                >
                  <CalendarDays size={12} />
                  <span className="truncate max-w-[120px]">Day {selectedDay.dayNumber} · {selectedDay.title}</span>
                  {training.sessionStatus === "draft" && <X size={11} className="opacity-60" />}
                </button>
              )}
              {activeModule && (
                <>
                  <ChevronRight size={13} className="text-gray-300 shrink-0" />
                  <span className="text-sm text-brand-600 font-medium truncate hidden sm:inline">
                    {activeModule.title}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Center: pulse */}
          <div className="hidden md:flex items-center">
            <PulseMonitor />
          </div>

          {/* Right: status + participant count + toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {participantCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
                <Users size={12} />
                {participantCount}
              </div>
            )}

            <div className={cn("flex items-center gap-1.5 border rounded-full px-2.5 py-1", statusConfig.pill)}>
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                {(training.sessionStatus === "live" || training.sessionStatus === "connecting") && (
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", statusConfig.dot)} />
                )}
                <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", statusConfig.dot)} />
              </span>
              <span className="text-[11px] font-semibold">{statusConfig.label}</span>
            </div>

            {/* Mobile: toggle right panel */}
            <button
              className="md:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setRightOpen(true)}
            >
              <SlidersHorizontal size={17} />
            </button>

            {/* Desktop: collapse right panel */}
            <button
              className="hidden md:flex p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setRightOpen((v) => !v)}
              title={rightOpen ? "Collapse panel" : "Expand panel"}
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Socket status banner */}
        {socketStatus !== "connected" && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-1.5 text-xs font-semibold flex-shrink-0",
            socketStatus === "reconnecting"
              ? "bg-amber-50 text-amber-700 border-b border-amber-200"
              : "bg-red-50 text-red-700 border-b border-red-200",
          )}>
            {socketStatus === "reconnecting" ? (
              <><RefreshCw size={12} className="animate-spin" /> Reconnecting to session...</>
            ) : (
              <><WifiOff size={12} /> Disconnected — changes may not be received</>
            )}
          </div>
        )}

        {/* Module canvas */}
        <div className="flex-1 overflow-auto bg-white relative">
          <ModuleStopwatch canControl={canDo(role as TrainingRole | undefined, "pause_room")} />
          <div className="h-full overflow-hidden">
            {renderModuleArea()}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {rightOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setRightOpen(false)}
        />
      )}

      {/* ── RIGHT PANEL ── */}
      <div
        className={cn(
          "bg-white border-l border-gray-100 flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300",
          "fixed md:relative inset-y-0 right-0 z-50",
          rightOpen
            ? "w-[280px] translate-x-0"
            : "w-0 md:w-0 translate-x-full md:translate-x-0",
        )}
      >
        {/* Mobile close header */}
        <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 md:hidden flex-shrink-0">
          <span className="text-sm font-bold text-gray-800">Session Panel</span>
          <button className="text-gray-400 p-1 hover:text-gray-700" onClick={() => setRightOpen(false)}>
            <X size={17} />
          </button>
        </div>

        {/* Tab strip */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-[11px] font-semibold transition-colors",
                activeTab === id
                  ? "text-brand-600 border-b-2 border-brand-500"
                  : "text-gray-400 hover:text-gray-700 border-b-2 border-transparent",
              )}
            >
              <Icon size={15} strokeWidth={activeTab === id ? 2.5 : 2} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "control" && (
            <ControlPanel
              trainingId={trainingId}
              workspaceId={training.workspaceId}
              training={training}
              userTrainingRole={role as TrainingRole | undefined}
            />
          )}
          {activeTab === "agenda" && (
            <AgendaPane trainingId={trainingId} workspaceId={activeWorkspaceId} />
          )}
          {activeTab === "participants" && <ParticipantGrid />}
          {activeTab === "responses" && <SessionDashboard training={training} />}
        </div>
      </div>
    </div>
  );
}
