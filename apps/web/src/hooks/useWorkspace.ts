"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, setWorkspaceHeader } from "@/lib/api-client";
import { useWorkspaceStore } from "@/store/workspace";
import type { Workspace } from "@oruclass/types";

export function useWorkspaces() {
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);

  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const { data } = await apiClient.get<Workspace[]>("/api/workspaces");
      setWorkspaces(data);
      return data;
    },
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  const addWorkspace = useWorkspaceStore((s) => s.addWorkspace);

  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await apiClient.post<Workspace>("/api/workspaces", { name });
      return data;
    },
    onSuccess: (workspace) => {
      addWorkspace(workspace);
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) =>
      apiClient.delete(`/api/workspaces/${workspaceId}`, {
        headers: { "X-Workspace-ID": workspaceId },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useWorkspace(workspaceId: string) {
  const setUserRole = useWorkspaceStore((s) => s.setUserRole);

  return useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      setWorkspaceHeader(workspaceId);
      const { data } = await apiClient.get<Workspace>(`/api/workspaces/${workspaceId}`, {
        headers: { "X-Workspace-ID": workspaceId },
      });
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const { data } = await apiClient.get<
        Array<{ userId: string; role: string; user: { id: string; name: string; email: string } }>
      >(`/api/workspaces/${workspaceId}/members`, {
        headers: { "X-Workspace-ID": workspaceId },
      });
      return data;
    },
    enabled: !!workspaceId,
  });
}
