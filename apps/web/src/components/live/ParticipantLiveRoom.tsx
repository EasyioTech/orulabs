"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useLiveSessionStore } from "@/store/liveSession";
import { useSocketSession } from "@/hooks/useSocket";
import { useParticipantTraining } from "@/hooks/useTrainings";
import { QUEUE_KEY, loadQueue, saveQueue } from "@/hooks/useResponseSubmit";
import { JoinSlide } from "./JoinSlide";
import { CompletedSlide } from "./CompletedSlide";
import { SelectModuleSlide } from "./SelectModuleSlide";
import { ParticipantModuleRenderer } from "../tools/ParticipantModuleRenderer";
import { ParticipantScratchpad } from "./ParticipantScratchpad";
import { ModuleStopwatch } from "./ModuleStopwatch";
import { GuestUpgradeBanner } from "./GuestUpgradeBanner";
import { DraggableVideoDock } from "./DraggableVideoDock";
import { LiveChatDock } from "./LiveChatDock";
import { cn } from "@oruclass/utils";
import { WifiOff, RefreshCw, Video, MessageSquare, PauseCircle, Mic, MicOff, Camera, MonitorUp, PhoneOff, Hand } from "lucide-react";

function clearQueue(trainingId: string) {
  try {
    localStorage.removeItem(QUEUE_KEY(trainingId));
  } catch {}
}

export function ParticipantLiveRoom({ trainingId }: { trainingId: string }) {
  const [videoOpen, setVideoOpen] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraMuted, setCameraMuted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [hasLostFocus, setHasLostFocus] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data: training } = useParticipantTraining(trainingId);
  const socket = useSocketSession(trainingId);
  const activeModule = useLiveSessionStore((s) => s.activeModule);
  const setActiveModule = useLiveSessionStore((s) => s.setActiveModule);
  const addParticipant = useLiveSessionStore((s) => s.addParticipant);
  const socketStatus = useLiveSessionStore((s) => s.socketStatus);
  const isPaused = useLiveSessionStore((s) => s.isPaused);
  const flushingRef = useRef(false);
  const boundsRef = useRef<HTMLDivElement>(null);

  // Track visibility (focus tracking)
  useEffect(() => {
    if (!socket || !trainingId || training?.sessionStatus !== "live") return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        socket.emit("participant:focus_lost", { trainingId });
        setHasLostFocus(true);
      } else {
        socket.emit("participant:focus_restored", { trainingId });
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket, trainingId, training?.sessionStatus]);

  // Flush any queued offline responses when reconnected
  const flushQueue = useCallback(() => {
    if (!socket || flushingRef.current) return;
    const queue = loadQueue(trainingId);
    if (queue.length === 0) return;

    flushingRef.current = true;
    let remaining = [...queue];

    const sendNext = () => {
      if (remaining.length === 0) {
        clearQueue(trainingId);
        flushingRef.current = false;
        return;
      }
      const item = remaining[0];
      socket.emit(
        "response:submit",
        { trainingId, moduleId: item.moduleId, responseData: item.responseData as Record<string, unknown> },
        (result) => {
          if (result.ok) {
            remaining = remaining.slice(1);
            saveQueue(trainingId, remaining);
          }
          sendNext();
        },
      );
    };
    sendNext();
  }, [socket, trainingId]);

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
      role: "participant",
      joinedAt: new Date().toISOString(),
      connectionStatus: "online",
    });

    const handleConnect = () => {
      socket.emit("participant:join", { trainingId, role: "participant" });
      flushQueue();
    };

    if (socket.connected && training?.sessionStatus !== "draft" && training?.sessionStatus !== "completed") {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [user, trainingId, socket, training?.sessionStatus, flushQueue]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!training) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const renderContent = () => {
    if (training.sessionStatus === "completed") {
      return <CompletedSlide training={training} isTrainer={false} />;
    }
    if (training.sessionStatus === "draft" || training.sessionStatus === "connecting") {
      return <JoinSlide training={training} trainingId={trainingId} isTrainer={false} />;
    }
    if (training.sessionStatus === "paused") {
      return <SelectModuleSlide training={training} isTrainer={false} />;
    }
    if (activeModule) {
      return (
        <ParticipantModuleRenderer
          key={activeModule.id}
          module={activeModule}
          trainingId={trainingId}
        />
      );
    }
    return <SelectModuleSlide training={training} isTrainer={false} />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Top bar */}
      <div className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-4 flex-shrink-0">
        <h2 className="font-semibold text-gray-900 text-[14px] truncate max-w-[200px] sm:max-w-none">
          {training.title}
        </h2>
        {(() => {
          const cfg = ({
            live:       { label: "Live",    dot: "bg-green-500", pill: "bg-green-50 text-green-700 border-green-200" },
            connecting: { label: "Open",    dot: "bg-blue-500",  pill: "bg-blue-50 text-blue-700 border-blue-200" },
            paused:     { label: "Paused",  dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700 border-amber-200" },
            draft:      { label: "Draft",   dot: "bg-gray-400",  pill: "bg-gray-50 text-gray-500 border-gray-100" },
            completed:  { label: "Ended",   dot: "bg-gray-400",  pill: "bg-gray-50 text-gray-500 border-gray-100" },
          } as Record<string, { label: string; dot: string; pill: string }>)[training.sessionStatus]
            ?? { label: training.sessionStatus, dot: "bg-gray-400", pill: "bg-gray-50 text-gray-500 border-gray-100" };
          return (
            <div className="flex items-center gap-2">
              <div className={cn("flex items-center gap-1.5 border rounded-full px-2.5 py-1", cfg.pill)}>
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  {(training.sessionStatus === "live" || training.sessionStatus === "connecting") && (
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", cfg.dot)} />
                  )}
                  <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", cfg.dot)} />
                </span>
                <span className="text-[11px] font-semibold">{cfg.label}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Guest → account upgrade nudge (only for guest participants) */}
      <GuestUpgradeBanner />

      {/* Socket status banner */}
      {socketStatus !== "connected" && (
        <div className={cn(
          "flex items-center gap-2 px-4 py-1.5 text-xs font-semibold flex-shrink-0",
          socketStatus === "reconnecting"
            ? "bg-amber-50 text-amber-700 border-b border-amber-200"
            : "bg-red-50 text-red-700 border-b border-red-200",
        )}>
          {socketStatus === "reconnecting" ? (
            <><RefreshCw size={12} className="animate-spin" /> Reconnecting — your responses are saved locally</>
          ) : (
            <><WifiOff size={12} /> You are offline — responses will sync when reconnected</>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden relative" ref={boundsRef}>
        <div className="flex-1 relative overflow-y-auto w-full">
          <ModuleStopwatch />
          {renderContent()}
        </div>

        {/* Session Paused Overlay Banner */}
        {isPaused && training.sessionStatus === "paused" && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 bg-amber-500/95 text-white rounded-2xl shadow-2xl px-8 py-6 mx-4 animate-in fade-in zoom-in duration-300">
              <PauseCircle size={40} className="opacity-90" />
              <div className="text-center">
                <p className="font-bold text-lg">Session Paused</p>
                <p className="text-sm opacity-80 mt-1">The trainer has paused the session. Please wait.</p>
              </div>
            </div>
          </div>
        )}

        {/* Floating Video Conference Dock */}
        {videoOpen && (
          <DraggableVideoDock
            trainingId={trainingId}
            boundsRef={boundsRef}
            onClose={() => setVideoOpen(false)}
          />
        )}
        {chatOpen && (
          <LiveChatDock
            trainingId={trainingId}
            boundsRef={boundsRef}
            onClose={() => setChatOpen(false)}
            onUnreadChange={(updater) => setChatUnread(updater)}
          />
        )}

        {/* Attention Tracking Blocker */}
        {hasLostFocus && (
          <div className="absolute inset-0 z-50 bg-gray-900/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm pointer-events-auto">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff size={32} /> 
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Attention Required</h3>
              <p className="text-gray-600 mb-6">
                You switched tabs or left the session. This session requires your full attention. The trainer has been notified.
              </p>
              <button
                onClick={() => setHasLostFocus(false)}
                className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors"
              >
                I'm back, resume session
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV (Google Meet Style) */}
      <div className="h-16 border-t border-gray-100 bg-white flex items-center justify-between px-6 flex-shrink-0 z-20 w-full">
        <div className="w-1/3 min-w-0 flex items-center justify-start">
          <span className="text-[14px] text-gray-700 truncate block font-medium">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {training.title}
          </span>
        </div>

        <div className="w-1/3 min-w-0 flex items-center justify-center gap-3">
          {training.type !== "in_person" ? (
            <>
              <button
                onClick={() => {
                  setMicMuted(v => !v);
                  alert(`Microphone ${!micMuted ? "muted" : "unmuted"}`);
                }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm",
                  micMuted ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
                title="Toggle Microphone"
              >
                {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                onClick={() => {
                  setCameraMuted(v => !v);
                  alert(`Camera ${!cameraMuted ? "turned off" : "turned on"}`);
                }}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm",
                  cameraMuted ? "bg-red-500 text-white hover:bg-red-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
                title="Toggle Camera"
              >
                <Camera size={18} />
              </button>
              <button
                onClick={() => setVideoOpen(v => !v)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm",
                  videoOpen ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
                title="Toggle Video Panel"
              >
                <MonitorUp size={18} />
              </button>
              <button
                onClick={() => {
                  alert("Leaving the call");
                  window.location.href = "/dashboard";
                }}
                className="w-12 h-10 rounded-[20px] flex items-center justify-center transition-colors bg-red-500 text-white hover:bg-red-600 shadow-sm ml-2"
                title="Leave Call"
              >
                <PhoneOff size={18} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => alert("Trainer has been notified that your hand is raised.")}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                title="Raise Hand"
              >
                <Hand size={18} />
              </button>
              <button
                onClick={() => setChatOpen(v => !v)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors relative shadow-sm",
                  chatOpen ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
                title="Toggle Chat"
              >
                <MessageSquare size={18} />
                {chatUnread > 0 && !chatOpen && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5">
                    {chatUnread > 9 ? "9+" : chatUnread}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        <div className="w-1/3 min-w-0 flex items-center justify-end gap-3">
          {training.type !== "in_person" && (
            <button
              onClick={() => setChatOpen(v => !v)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors relative",
                chatOpen ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-white text-gray-500 hover:bg-gray-100"
              )}
              title="Toggle Chat"
            >
              <MessageSquare size={18} />
              {chatUnread > 0 && !chatOpen && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5">
                  {chatUnread > 9 ? "9+" : chatUnread}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* FAB Scratchpad */}
      {training.sessionStatus !== "completed" && (
        <ParticipantScratchpad trainingId={trainingId} />
      )}
    </div>
  );
}
