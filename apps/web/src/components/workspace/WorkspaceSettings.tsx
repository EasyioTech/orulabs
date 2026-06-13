"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

export function WorkspaceSettings({ workspaceId }: { workspaceId: string }) {
  const { data: workspace } = useWorkspace(workspaceId);
  const qc = useQueryClient();

  const { register, handleSubmit, reset } = useForm<{ name: string }>();

  useEffect(() => {
    if (workspace) reset({ name: workspace.name });
  }, [workspace, reset]);

  const mutation = useMutation({
    mutationFn: (data: { name: string }) =>
      apiClient.patch(`/api/workspaces/${workspaceId}`, data, {
        headers: { "X-Workspace-ID": workspaceId },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspace", workspaceId] }),
  });

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="bg-white rounded-xl border border-gray-100 p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            {...register("name")}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
