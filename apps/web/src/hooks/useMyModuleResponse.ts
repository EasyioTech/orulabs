"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import type { ParticipantResponse } from "@oruclass/types";

export function useMyModuleResponse(trainingId: string, moduleId: string) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";

  return useQuery({
    queryKey: ["my-module-response", trainingId, moduleId],
    queryFn: async () => {
      const res = await apiClient.get<ParticipantResponse | null>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${moduleId}/responses/me`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      return res.data;
    },
    enabled: !!workspaceId && !!trainingId && !!moduleId,
    staleTime: 5000,
  });
}
