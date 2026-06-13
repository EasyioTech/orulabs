import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Workspace, WorkspaceRole } from "@oruclass/types";

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  userRoles: Record<string, WorkspaceRole>;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (id: string) => void;
  setActiveWorkspace: (id: string) => void;
  setUserRole: (workspaceId: string, role: WorkspaceRole) => void;
  reset: () => void;
}

function pickActive(workspaces: Workspace[], current: string | null): string | null {
  if (current && workspaces.some((w) => w.id === current)) return current;
  return workspaces[0]?.id ?? null;
}

function pruneRoles(roles: Record<string, WorkspaceRole>, workspaces: Workspace[]): Record<string, WorkspaceRole> {
  const valid = new Set(workspaces.map((w) => w.id));
  const next: Record<string, WorkspaceRole> = {};
  for (const [id, role] of Object.entries(roles)) {
    if (valid.has(id)) next[id] = role;
  }
  return next;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaces: [],
      activeWorkspaceId: null,
      userRoles: {},
      setWorkspaces: (workspaces) =>
        set((s) => ({
          workspaces,
          activeWorkspaceId: pickActive(workspaces, s.activeWorkspaceId),
          userRoles: pruneRoles(s.userRoles, workspaces),
        })),
      addWorkspace: (workspace) =>
        set((s) => ({
          workspaces: [...s.workspaces, workspace],
          activeWorkspaceId: s.activeWorkspaceId ?? workspace.id,
        })),
      removeWorkspace: (id) =>
        set((s) => {
          const workspaces = s.workspaces.filter((w) => w.id !== id);
          return {
            workspaces,
            activeWorkspaceId: pickActive(workspaces, s.activeWorkspaceId === id ? null : s.activeWorkspaceId),
            userRoles: pruneRoles(s.userRoles, workspaces),
          };
        }),
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      setUserRole: (workspaceId, role) =>
        set((s) => ({ userRoles: { ...s.userRoles, [workspaceId]: role } })),
      reset: () => set({ workspaces: [], activeWorkspaceId: null, userRoles: {} }),
    }),
    { name: "oruclass-workspace" },
  ),
);
