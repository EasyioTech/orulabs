import type { TrainingRole } from "@oruclass/types";

// Context variables set by middleware (auth, workspace tenant, role guard).
// Typing the Hono instance with this makes c.get("userId") etc. type-safe.
export type AppVariables = {
  userId: string;
  userEmail: string;
  userName?: string;
  workspaceId: string;
  workspaceRole: string;
  trainingRole: TrainingRole;
};

export type AppEnv = { Variables: AppVariables };
