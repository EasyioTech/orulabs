"use client";

import { useWorkspace } from "@/hooks/useWorkspace";
import { useTrainings } from "@/hooks/useTrainings";
import Link from "next/link";

export function WorkspaceHome({ workspaceId }: { workspaceId: string }) {
  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  const { data: trainings } = useTrainings(workspaceId);

  if (isLoading) return <div className="animate-pulse h-8 w-48 bg-gray-200 rounded" />;
  if (!workspace) return <p className="text-gray-500">Workspace not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
        <Link
          href={`/workspaces/${workspaceId}/settings`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Settings
        </Link>
      </div>
      <p className="text-gray-500 text-sm">{trainings?.length ?? 0} trainings</p>
    </div>
  );
}
