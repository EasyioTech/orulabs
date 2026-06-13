import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { trainingFacilitatorInvitations, trainingFacilitators, users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { invalidateRoleCache } from "../middleware/roleGuard";

export const facilitatorInvitationsRouter = new Hono<AppEnv>();

// GET /api/invitations/:token — public, preview invite info
facilitatorInvitationsRouter.get("/:token", async (c) => {
  const { token } = c.req.param();

  const invitation = await db.query.trainingFacilitatorInvitations.findFirst({
    where: eq(trainingFacilitatorInvitations.token, token),
    with: { training: true, inviter: true },
  });

  if (!invitation) return c.json({ error: "Invitation not found" }, 404);
  if (invitation.status !== "pending") {
    return c.json({ error: "Invitation is no longer valid", status: invitation.status }, 410);
  }
  if (invitation.expiresAt < new Date()) {
    return c.json({ error: "Invitation has expired" }, 410);
  }

  return c.json({
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    trainingId: invitation.trainingId,
    workspaceId: invitation.training.workspaceId,
    trainingTitle: invitation.training.title,
    inviterName: invitation.inviter?.name ?? "A teammate",
    expiresAt: invitation.expiresAt,
  });
});

// POST /api/invitations/:token/accept — auth required
facilitatorInvitationsRouter.post("/:token/accept", authMiddleware, async (c) => {
  const { token } = c.req.param();
  const userId = c.get("userId") as string;

  const invitation = await db.query.trainingFacilitatorInvitations.findFirst({
    where: eq(trainingFacilitatorInvitations.token, token),
  });

  if (!invitation) return c.json({ error: "Invitation not found" }, 404);
  if (invitation.status !== "pending") {
    return c.json({ error: "Invitation already used", status: invitation.status }, 410);
  }
  if (invitation.expiresAt < new Date()) {
    return c.json({ error: "Invitation has expired" }, 410);
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || user.email !== invitation.email) {
    return c.json({ error: "This invitation was sent to a different email address" }, 403);
  }

  const existing = await db.query.trainingFacilitators.findFirst({
    where: and(
      eq(trainingFacilitators.trainingId, invitation.trainingId),
      eq(trainingFacilitators.userId, userId),
    ),
  });

  if (!existing) {
    await db.insert(trainingFacilitators).values({
      trainingId: invitation.trainingId,
      userId,
      role: invitation.role as "lead_trainer" | "full_editor" | "partial_editor" | "facilitation_support",
      assignedModules: [],
    });
    invalidateRoleCache(userId, invitation.trainingId);
  }

  await db
    .update(trainingFacilitatorInvitations)
    .set({ status: "accepted" })
    .where(eq(trainingFacilitatorInvitations.id, invitation.id));

  return c.json({ success: true, trainingId: invitation.trainingId });
});

// POST /api/invitations/:token/decline — auth required
facilitatorInvitationsRouter.post("/:token/decline", authMiddleware, async (c) => {
  const { token } = c.req.param();
  const userId = c.get("userId") as string;

  const invitation = await db.query.trainingFacilitatorInvitations.findFirst({
    where: eq(trainingFacilitatorInvitations.token, token),
  });

  if (!invitation) return c.json({ error: "Invitation not found" }, 404);
  if (invitation.status !== "pending") {
    return c.json({ error: "Invitation already used", status: invitation.status }, 410);
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || user.email !== invitation.email) {
    return c.json({ error: "This invitation was sent to a different email address" }, 403);
  }

  await db
    .update(trainingFacilitatorInvitations)
    .set({ status: "declined" })
    .where(eq(trainingFacilitatorInvitations.id, invitation.id));

  return c.json({ success: true });
});
