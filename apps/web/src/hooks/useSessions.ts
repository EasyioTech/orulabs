"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { LiveSession, SessionStats, SubmissionEntry } from "@oruclass/types";

export function useSessionHistory(workspaceId: string, trainingId: string) {
  return useQuery({
    queryKey: ["sessions", workspaceId, trainingId],
    queryFn: async () => {
      const { data } = await apiClient.get<Array<LiveSession & { totalResponses: number; uniqueRespondents: number }>>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/sessions`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    enabled: !!workspaceId && !!trainingId,
  });
}

export function useCurrentSession(workspaceId: string, trainingId: string) {
  return useQuery({
    queryKey: ["sessions", workspaceId, trainingId, "current"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ session: LiveSession | null; stats: SessionStats | null }>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/sessions/current`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    enabled: !!workspaceId && !!trainingId,
    refetchInterval: 10_000,
  });
}

export function useUpdateTargetResponses(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetResponses: number | null) =>
      apiClient.patch(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/sessions/current`,
        { targetResponses },
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions", workspaceId, trainingId, "current"] }),
  });
}

export function useSessionParticipants(
  workspaceId: string,
  trainingId: string,
  sessionId: string | null,
  moduleId: string | null,
  page: number = 1,
) {
  return useQuery({
    queryKey: ["session-participants", workspaceId, trainingId, sessionId, moduleId, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (moduleId) params.set("moduleId", moduleId);
      const { data } = await apiClient.get<{ items: SubmissionEntry[]; total: number; page: number; limit: number }>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/sessions/${sessionId}/participants?${params}`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    enabled: !!workspaceId && !!trainingId && !!sessionId,
    refetchInterval: 5_000,
  });
}

export function useParticipantResponse(
  workspaceId: string,
  trainingId: string,
  sessionId: string | null,
  userId: string | null,
  moduleId: string | null,
) {
  return useQuery({
    queryKey: ["participant-response", sessionId, userId, moduleId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ responseData: Record<string, unknown>; submittedAt: string; timeSpentSeconds: number | null; user: { name: string } }>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/sessions/${sessionId}/participants/${userId}/response?moduleId=${moduleId}`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    enabled: !!sessionId && !!userId && !!moduleId,
  });
}
