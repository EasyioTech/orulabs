import { z } from "zod";
import type { Context } from "hono";

export async function parseBody<T extends z.ZodTypeAny>(
  c: Context,
  schema: T,
): Promise<z.infer<T>> {
  const body = await c.req.json();
  return schema.parse(body);
}

export function parseQuery<T extends z.ZodTypeAny>(c: Context, schema: T): z.infer<T> {
  const query = c.req.query();
  return schema.parse(query);
}

export function parseParam<T extends z.ZodTypeAny>(c: Context, schema: T): z.infer<T> {
  const param = c.req.param();
  return schema.parse(param);
}
