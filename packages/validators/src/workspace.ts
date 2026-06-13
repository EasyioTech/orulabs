import { z } from "zod";

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  settings: z
    .object({
      allowGuestJoin: z.boolean().optional(),
      maxParticipants: z.number().int().min(1).max(500).optional(),
    })
    .optional(),
});

export const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial();

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
