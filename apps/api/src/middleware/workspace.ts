import type { MiddlewareHandler } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { workspaceMembers } from "../db/schema";

// Extracts and validates workspace context, attaches workspaceId + userRole to ctx
export const workspaceTenantMiddleware: MiddlewareHandler = async (c, next) => {
  const workspaceId =
    c.req.header("X-Workspace-ID") ??
    c.req.param("workspaceId") ??
    c.req.query("workspace_id");

  if (!workspaceId) {
    return c.json({ error: "Missing workspace ID", code: "NO_WORKSPACE" }, 400);
  }

  const userId = c.get("userId") as string;

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userId),
    ),
  });

  if (!membership) {
    return c.json({ error: "Workspace not found or access denied", code: "WORKSPACE_FORBIDDEN" }, 404);
  }

  c.set("workspaceId", workspaceId);
  c.set("workspaceRole", membership.role);

  await next();
};
