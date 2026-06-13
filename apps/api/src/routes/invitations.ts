import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users, workspaces } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { sendInvitationEmail } from "../services/email.service";
import { randomBytes } from "crypto";

export const invitationsRouter = new Hono<AppEnv>();

invitationsRouter.use("*", authMiddleware);
invitationsRouter.use("*", workspaceTenantMiddleware);

invitationsRouter.post("/invite", async (c) => {
  const workspaceId = c.get("workspaceId") as string;
  const inviterId = c.get("userId") as string;
  const { email } = await c.req.json<{ email: string; role?: string }>();

  if (!email) return c.json({ error: "email required" }, 400);

  const inviter = await db.query.users.findFirst({ where: eq(users.id, inviterId) });

  const joinToken = randomBytes(16).toString("hex");
  const joinUrl = `${process.env.NEXT_PUBLIC_API_URL}/join/${joinToken}`;

  const workspace = await db.query.workspaces.findFirst({ where: eq(workspaces.id, workspaceId) });

  await sendInvitationEmail({
    to: email,
    inviterName: inviter?.name ?? "A teammate",
    workspaceName: workspace?.name ?? "a workspace",
    joinUrl,
  });

  return c.json({ success: true, joinUrl }, 201);
});
