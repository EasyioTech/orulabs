import { z } from "zod";

export const InviteByEmailSchema = z.object({
  emails: z
    .array(z.string().email("Invalid email address"))
    .min(1, "At least one email required")
    .max(50, "Cannot invite more than 50 at once"),
  role: z
    .enum(["lead_trainer", "full_editor", "partial_editor", "facilitation_support"])
    .optional(),
});

export const SubmitResponseSchema = z.object({
  moduleId: z.string().uuid(),
  responseData: z.unknown(),
});

export type InviteByEmailInput = z.infer<typeof InviteByEmailSchema>;
export type SubmitResponseInput = z.infer<typeof SubmitResponseSchema>;
