"use client";

import { useEffect, useState } from "react";
import type { Training } from "@oruclass/types";
import { useAuthStore } from "@/store/auth";
import { useLiveSessionStore } from "@/store/liveSession";
import { useSocketSession } from "@/hooks/useSocket";

export interface AttentionAlert {
  id: string;
  message: string;
}

type Grant = "unlock_modules" | "pause_room";

/**
 * Owns every socket subscription for the trainer live room plus the DB→state
 * fallback sync. Extracted from TrainerLiveRoom so the component is pure layout:
 * the room joins on (re)connect, mirrors session/permission/attention events into
 * the live-session store, and surfaces transient attention toasts via return value.
 */
export function useTrainerLiveSocket(training: Training | undefined) {
  const trainingId = training?.id ?? "";
  const user = useAuthStore((s) => s.user);
  const socket = useSocketSession(trainingId);

  const [attentionAlerts, setAttentionAlerts] = useState<AttentionAlert[]>([]);

  const activeModule = useLiveSessionStore((s) => s.activeModule);
  const setActiveModule = useLiveSessionStore((s) => s.setActiveModule);
  const setSessionStats = useLiveSessionStore((s) => s.setSessionStats);
  const addGrantedPermission = useLiveSessionStore((s) => s.addGrantedPermission);
  const revokeGrantedPermission = useLiveSessionStore((s) => s.revokeGrantedPermission);
  const setGrantedPermissions = useLiveSessionStore((s) => s.setGrantedPermissions);
  const setSessionGrants = useLiveSessionStore((s) => s.setSessionGrants);
  const addParticipant = useLiveSessionStore((s) => s.addParticipant);

  const sessionStatus = training?.sessionStatus;
  const currentActiveModuleId = training?.currentActiveModuleId;
  const modules = training?.modules;

  // Fallback sync: if the module-unlock socket event was missed but the DB says a
  // module is live, restore it locally so the trainer isn't stuck on a stale slide.
  useEffect(() => {
    if (sessionStatus !== "live" || !currentActiveModuleId) return;
    if (activeModule?.id === currentActiveModuleId) return;
    const mod = modules?.find((m) => m.id === currentActiveModuleId);
    if (mod) setActiveModule(mod);
  }, [currentActiveModuleId, sessionStatus, activeModule, modules, setActiveModule]);

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
    if (socket.connected && sessionStatus !== "draft" && sessionStatus !== "completed") {
      handleConnect();
    }
    socket.on("connect", handleConnect);

    const handleSubmissionUpdate = (data: { submitted: number; totalParticipants: number; liveSessionId: string }) => {
      setSessionStats({
        submitted: data.submitted,
        totalParticipants: data.totalParticipants,
        completionPct: data.totalParticipants > 0 ? Math.round((data.submitted / data.totalParticipants) * 100) : 0,
        liveSessionId: data.liveSessionId,
      });
    };
    socket.on("session:submission_update", handleSubmissionUpdate);

    const handleAttentionAlert = (data: { userId: string; userName: string; isFocused: boolean }) => {
      if (data.isFocused) return;
      const id = crypto.randomUUID();
      const message = `${data.userName || "A participant"} has switched tabs (lost focus).`;
      setAttentionAlerts((prev) => [...prev, { id, message }]);
      setTimeout(() => setAttentionAlerts((prev) => prev.filter((a) => a.id !== id)), 5000);
    };
    socket.on("trainer:attention_alert", handleAttentionAlert);

    const handlePermissionGranted = (data: { permission: Grant; grantedBy: string }) => {
      addGrantedPermission(data.permission);
    };
    const handlePermissionRevoked = (data: { permission: Grant }) => {
      revokeGrantedPermission(data.permission);
    };
    const handleGrantsSnapshot = (data: { myGrants: Grant[]; allGrants: Record<string, Grant[]> }) => {
      setGrantedPermissions(data.myGrants);
      setSessionGrants(data.allGrants);
    };
    socket.on("session:permission_granted", handlePermissionGranted);
    socket.on("session:permission_revoked", handlePermissionRevoked);
    socket.on("session:grants_snapshot", handleGrantsSnapshot);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("session:submission_update", handleSubmissionUpdate);
      socket.off("trainer:attention_alert", handleAttentionAlert);
      socket.off("session:permission_granted", handlePermissionGranted);
      socket.off("session:permission_revoked", handlePermissionRevoked);
      socket.off("session:grants_snapshot", handleGrantsSnapshot);
    };
  }, [user, trainingId, socket, sessionStatus, setSessionStats, addParticipant, addGrantedPermission, revokeGrantedPermission, setGrantedPermissions, setSessionGrants]);

  return { socket, attentionAlerts };
}
