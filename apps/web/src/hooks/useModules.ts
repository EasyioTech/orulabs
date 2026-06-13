"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { TrainingModule } from "@oruclass/types";

export function useModules(workspaceId: string, trainingId: string) {
  return useQuery({
    queryKey: ["modules", trainingId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: TrainingModule[]; limit: number; offset: number }>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return data.data;
    },
    enabled: !!(workspaceId && trainingId),
  });
}

export function useUnlockModule(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (moduleId: string) =>
      apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${moduleId}/unlock`,
        {},
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", trainingId] });
      qc.invalidateQueries({ queryKey: ["training"] });
      qc.invalidateQueries({ queryKey: ["participant-training"] });
    },
    onError: (err: unknown) => {
      console.error("[useUnlockModule] failed:", err);
    },
  });
}

export function useUpdateModule(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: Partial<TrainingModule> }) =>
      apiClient.patch(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${moduleId}`,
        data,
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", trainingId] }),
  });
}

export function useDuplicateModule(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      targetTrainingId,
      targetDayId,
    }: {
      moduleId: string;
      targetTrainingId?: string;
      targetDayId?: string | null;
    }) =>
      apiClient.post<TrainingModule>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${moduleId}/duplicate`,
        { targetTrainingId, targetDayId },
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["modules", trainingId] });
      if (vars.targetTrainingId && vars.targetTrainingId !== trainingId) {
        qc.invalidateQueries({ queryKey: ["modules", vars.targetTrainingId] });
      }
      qc.invalidateQueries({ queryKey: ["training"] });
      qc.invalidateQueries({ queryKey: ["trainings"] });
    },
  });
}

export function useAssignModuleToDay(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, dayId }: { moduleId: string; dayId: string | null }) =>
      apiClient.patch(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${moduleId}`,
        { dayId },
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["modules", trainingId] });
      qc.invalidateQueries({ queryKey: ["training"] });
      qc.invalidateQueries({ queryKey: ["days", trainingId] });
    },
  });
}

export function useReorderModules(workspaceId: string, trainingId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (order: Array<{ id: string; position: number }>) =>
      apiClient.post(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/reorder`,
        { order },
        { headers: { "X-Workspace-ID": workspaceId } },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", trainingId] }),
  });
}
