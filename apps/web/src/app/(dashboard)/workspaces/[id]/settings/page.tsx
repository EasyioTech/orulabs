import type { Metadata } from "next";
import { WorkspaceSettings } from "@/components/workspace/WorkspaceSettings";

export const metadata: Metadata = { title: "Workspace Settings" };

export default async function WorkspaceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkspaceSettings workspaceId={id} />;
}
