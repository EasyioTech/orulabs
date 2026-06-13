import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import type { ParticipantResponseWithUser, Training, TrainingModule, TrainingDay } from "@oruclass/types";

export type WorkspaceResponseData = ParticipantResponseWithUser & {
  training: Training;
  module: TrainingModule & { day: TrainingDay | null };
};

export function useWorkspaceResponses() {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";

  return useQuery({
    queryKey: ["workspace-responses", workspaceId],
    queryFn: async () => {
      const res = await apiClient.get<WorkspaceResponseData[] | { data: WorkspaceResponseData[] }>(
        `/api/workspaces/${workspaceId}/responses`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      const body = res.data as unknown;
      if (Array.isArray(body)) return body as WorkspaceResponseData[];
      if (body && typeof body === "object" && Array.isArray((body as { data?: unknown }).data)) {
        return (body as { data: WorkspaceResponseData[] }).data;
      }
      return [] as WorkspaceResponseData[];
    },
    enabled: !!workspaceId,
    refetchOnWindowFocus: false,
  });
}
