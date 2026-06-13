"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Training, TrainingFacilitator, TrainingRole } from "@oruclass/types";

export function useTrainings(workspaceId: string) {
  return useQuery({
    queryKey: ["trainings", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get<Training[]>(
        `/api/workspaces/${workspaceId}/trainings`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useTraining(workspaceId: string, trainingId: string) {
  return useQuery({
    queryKey: ["training", workspaceId, trainingId],
    queryFn: async () => {
      const { data } = await apiClient.get<Training>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    // Wait for BOTH ids to be available — prevents fetching with empty workspaceId
    // which would return a training without facilitators (participant endpoint)
    enabled: !!trainingId && !!workspaceId,
    staleTime: 30_000,
  });
}

export function useCreateTraining(workspaceId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; labels?: string[]; type?: string; description?: string; venue?: string; meetingLink?: string; startDate?: string; endDate?: string }) =>
      apiClient.post<Training>(
        `/api/workspaces/${workspaceId}/trainings`,
        data,
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trainings", workspaceId] }),
  });
}

export function useUpdateTraining(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { title?: string; labels?: string[]; type?: string; description?: string; venue?: string; meetingLink?: string; startDate?: string; endDate?: string; checklist?: { id: string; label: string; done: boolean }[] }) =>
      apiClient.patch<Training>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}`,
        data,
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training", workspaceId, trainingId] });
      qc.invalidateQueries({ queryKey: ["trainings", workspaceId] });
    },
  });
}

export function useDeleteTraining(workspaceId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (trainingId: string) =>
      apiClient.delete(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}`,
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trainings", workspaceId] }),
  });
}

export function useUpdateTrainingStatus(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (status: "draft" | "connecting" | "live" | "paused" | "completed") =>
      apiClient.patch(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/status`,
        { status },
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training"] }),
  });
}

import { useAuthStore } from "@/store/auth";

export function useResetSession(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/reset`,
        {},
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training", workspaceId, trainingId] });
      qc.invalidateQueries({ queryKey: ["modules", trainingId] });
    },
  });
}

// For QR/link-joined participants who have no activeWorkspaceId
export function useParticipantTraining(trainingId: string) {
  return useQuery({
    queryKey: ["participant-training", trainingId],
    queryFn: async () => {
      const { data } = await apiClient.get<Training>(`/api/participant/trainings/${trainingId}`);
      return data;
    },
    enabled: !!trainingId,
    staleTime: 10_000,
    refetchInterval: 8_000, // poll as fallback if socket event is missed
  });
}

export function useAssignFacilitator(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { userId: string; role: TrainingRole; assignedModules?: string[] }) =>
      apiClient.post<TrainingFacilitator>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/facilitators`,
        { assignedModules: [], ...data },
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training"] }),
  });
}

export function useInviteFacilitator(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; role: TrainingRole }) =>
      apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/facilitators/invite`,
        data,
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training"] }),
  });
}

export function useCancelFacilitatorInvitation(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.delete(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/facilitators/invitations/${invitationId}`,
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training", workspaceId, trainingId] }),
  });
}

export function useFacilitatorInvitation(token: string | null) {
  return useQuery({
    queryKey: ["facilitator-invitation", token],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        id: string;
        email: string;
        role: TrainingRole;
        status: string;
        trainingId: string;
        workspaceId: string;
        trainingTitle: string;
        inviterName: string;
        expiresAt: string;
      }>(`/api/invitations/${token}`);
      return data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useAcceptFacilitatorInvitation() {
  return useMutation({
    mutationFn: (token: string) =>
      apiClient.post<{ success: boolean; trainingId: string }>(
        `/api/invitations/${token}/accept`,
        {},
      ),
  });
}

export function useMyTrainingRole(workspaceId: string, trainingId: string) {
  const { data: training, isLoading } = useTraining(workspaceId, trainingId);
  const user = useAuthStore((s) => s.user);

  // Still loading — return null so callers can show a spinner
  if (isLoading || !training || !user) return null;

  const facilitators = training.facilitators;
  if (!facilitators) return "participant" as "participant" | TrainingRole;

  const me = facilitators.find((f) => f.userId === user.id);
  return me ? me.role : ("participant" as "participant" | TrainingRole);
}

export function useTrash(workspaceId: string) {
  return useQuery({
    queryKey: ["trainings-trash", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get<Training[]>(
        `/api/workspaces/${workspaceId}/trainings/trash`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useSharedTrainings() {
  return useQuery({
    queryKey: ["facilitator-trainings"],
    queryFn: async () => {
      const { data } = await apiClient.get<Array<Training & { myRole: TrainingRole; assignedModules: string[] }>>(
        "/api/facilitator/trainings",
      );
      return data;
    },
  });
}

export function useResendFacilitatorInvitation(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/facilitators/invitations/${invitationId}/resend`,
        {},
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training", workspaceId, trainingId] }),
  });
}

export function useDeclineFacilitatorInvitation() {
  return useMutation({
    mutationFn: (token: string) =>
      apiClient.post(`/api/invitations/${token}/decline`, {}),
  });
}

export function useRestoreTraining(workspaceId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (trainingId: string) =>
      apiClient.patch(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/restore`,
        {},
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainings", workspaceId] });
      qc.invalidateQueries({ queryKey: ["trainings-trash", workspaceId] });
    },
  });
}
