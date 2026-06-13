import type { Metadata } from "next";
import { CreateWorkspaceForm } from "@/components/workspace/CreateWorkspaceForm";

export const metadata: Metadata = { title: "New Workspace" };

export default function NewWorkspacePage() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Workspace</h1>
      <CreateWorkspaceForm />
    </div>
  );
}
