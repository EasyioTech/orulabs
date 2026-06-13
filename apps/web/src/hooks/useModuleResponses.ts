"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import { useLiveSessionStore } from "@/store/liveSession";
import type { ParticipantResponseWithUser } from "@oruclass/types";

// Shared fetch for trainer-side module responses.
// Polling is a fallback only — `data:aggregate` socket invalidation drives
// realtime refresh. We poll slowly (20s) when socket is healthy, faster
// (5s) when it isn't, so a single KVM isn't hammered by N trainer clients
// refetching every 4–5s like the old per-component pattern did.
export function useModuleResponses(trainingId: string, moduleId: string) {
  const workspaceId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? "";
  const socketStatus = useLiveSessionStore((s) => s.socketStatus);
  const socketHealthy = socketStatus === "connected";

  return useQuery({
    queryKey: ["module-responses", trainingId, moduleId],
    queryFn: async () => {
      const res = await apiClient.get<ParticipantResponseWithUser[] | { data: ParticipantResponseWithUser[] }>(
        `/api/workspaces/${workspaceId}/trainings/${trainingId}/modules/${moduleId}/responses`,
        { headers: { "X-Workspace-ID": workspaceId } },
      );
      const body = res.data as unknown;
      if (Array.isArray(body)) return body as ParticipantResponseWithUser[];
      if (body && typeof body === "object" && Array.isArray((body as { data?: unknown }).data)) {
        return (body as { data: ParticipantResponseWithUser[] }).data;
      }
      return [] as ParticipantResponseWithUser[];
    },
    enabled: !!workspaceId && !!trainingId && !!moduleId,
    staleTime: 2000,
    refetchInterval: socketHealthy ? 20000 : 5000,
    refetchOnWindowFocus: false,
  });
}
