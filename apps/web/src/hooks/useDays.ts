"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { TrainingDay } from "@oruclass/types";

export function useDays(workspaceId: string, trainingId: string) {
  return useQuery({
    queryKey: ["days", trainingId],
    queryFn: async () => {
      const { data } = await apiClient.get<TrainingDay[]>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/days`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data;
    },
    enabled: !!(workspaceId && trainingId),
  });
}

export function useCreateDay(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { dayNumber: number; title: string; date?: string; description?: string }) =>
      apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/days`,
        data,
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["days", trainingId] }),
  });
}

export function useUpdateDay(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dayId, data }: { dayId: string; data: Partial<{ title: string; date: string | null; description: string; deliveryMode: "in_person" | "online" | "hybrid" }> }) =>
      apiClient.patch(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/days/${dayId}`,
        data,
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["days", trainingId] }),
  });
}

export function useDeleteDay(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dayId: string) =>
      apiClient.delete(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/days/${dayId}`,
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["days", trainingId] });
      qc.invalidateQueries({ queryKey: ["modules", trainingId] });
    },
  });
}

export function useReorderDays(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: Array<{ id: string; dayNumber: number }>) =>
      apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/days/reorder`,
        { order },
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["days", trainingId] }),
  });
}
