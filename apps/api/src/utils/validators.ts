import { z } from "zod";
import type { Context } from "hono";

export async function parseBody<T extends z.ZodTypeAny>(
  c: Context,
  schema: T,
): Promise<z.infer<T>> {
  const body = await c.req.json();
  return schema.parse(body);
}
