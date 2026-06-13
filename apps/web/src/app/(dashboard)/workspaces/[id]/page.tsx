import type { Metadata } from "next";
import { WorkspaceHome } from "@/components/workspace/WorkspaceHome";

export const metadata: Metadata = { title: "Workspace" };

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkspaceHome workspaceId={id} />;
}
