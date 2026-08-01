"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { AIDataAnalysisTab } from "@/components/ai-integration/AIDataAnalysisTab";

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
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>
      
      <Tabs.Root defaultValue="general" className="flex flex-col">
        <Tabs.List className="flex border-b border-gray-200 mb-6">
          <Tabs.Trigger
            value="general"
            className="px-4 py-2 font-medium text-sm text-gray-600 hover:text-gray-900 data-[state=active]:text-[#1a73e8] data-[state=active]:border-b-2 data-[state=active]:border-[#1a73e8] outline-none transition-colors"
          >
            General
          </Tabs.Trigger>
          <Tabs.Trigger
            value="ai-integration"
            className="px-4 py-2 font-medium text-sm text-gray-600 hover:text-gray-900 data-[state=active]:text-[#1a73e8] data-[state=active]:border-b-2 data-[state=active]:border-[#1a73e8] outline-none transition-colors flex items-center gap-2"
          >
            AI & Data Analysis
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="general" className="max-w-lg outline-none">
          <form
            onSubmit={handleSubmit((d) => mutation.mutate(d))}
            className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 shadow-sm"
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
              className="px-4 py-2 bg-[#1a73e8] text-white rounded text-sm font-medium hover:bg-[#1557b0] disabled:opacity-60 transition-colors"
            >
              {mutation.isPending ? "Saving…" : "Save changes"}
            </button>
          </form>
        </Tabs.Content>

        <Tabs.Content value="ai-integration" className="outline-none">
          <AIDataAnalysisTab workspaceId={workspaceId} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
