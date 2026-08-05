export type WorkspaceRole = "owner" | "member";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  settings: WorkspaceSettings;
  createdAt: Date;
}

export interface WorkspaceSettings {
  allowGuestJoin?: boolean;
  maxParticipants?: number;
  enableRaiseHand?: boolean;
  enableChat?: boolean;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface WorkspaceWithMembership extends Workspace {
  role: WorkspaceRole;
  memberCount: number;
}
