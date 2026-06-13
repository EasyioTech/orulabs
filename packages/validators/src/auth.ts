import { z } from "zod";

export const SignInSchema = z.object({
  redirectUrl: z.string().url().optional(),
});

export const CallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
});

export type SignInInput = z.infer<typeof SignInSchema>;
export type CallbackInput = z.infer<typeof CallbackSchema>;
