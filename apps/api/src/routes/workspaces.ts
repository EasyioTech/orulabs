import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { workspaces, workspaceMembers, trainings, participantResponses, trainingModules } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { CreateWorkspaceSchema, UpdateWorkspaceSchema } from "@oruclass/validators";
import { parseBody } from "../utils/validators";

export const workspacesRouter = new Hono<AppEnv>();

workspacesRouter.use("*", authMiddleware);

// GET /workspaces — list workspaces for current user
workspacesRouter.get("/", async (c) => {
  const userId = c.get("userId") as string;

  const memberships = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.userId, userId),
    with: { workspace: true },
  });

  const result = memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }));

  return c.json(result);
});

// POST /workspaces — create new workspace
workspacesRouter.post("/", async (c) => {
  const userId = c.get("userId") as string;
  const body = await parseBody(c, CreateWorkspaceSchema);

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: body.name,
      ownerId: userId,
      settings: body.settings ?? {},
    })
    .returning();

  // Owner is automatically a member
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId,
    role: "owner",
  });

  return c.json(workspace, 201);
});

// GET /workspaces/:workspaceId — get workspace details
workspacesRouter.get("/:workspaceId", workspaceTenantMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId") as string;

  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
    with: { members: { with: { user: true } } },
  });

  if (!workspace) return c.json({ error: "Not found" }, 404);
  return c.json(workspace);
});

// PATCH /workspaces/:workspaceId — update workspace
workspacesRouter.patch("/:workspaceId", workspaceTenantMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId") as string;
  const userId = c.get("userId") as string;
  const body = await parseBody(c, UpdateWorkspaceSchema);

  // Only owner can update
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userId),
    ),
  });
  if (membership?.role !== "owner") {
    return c.json({ error: "Only workspace owner can update settings" }, 403);
  }

  const [updated] = await db
    .update(workspaces)
    .set({ name: body.name, settings: body.settings ?? {} })
    .where(eq(workspaces.id, workspaceId))
    .returning();

  return c.json(updated);
});

// DELETE /workspaces/:workspaceId
workspacesRouter.delete("/:workspaceId", workspaceTenantMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId") as string;
  const userId = c.get("userId") as string;

  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userId),
    ),
  });
  if (membership?.role !== "owner") {
    return c.json({ error: "Only owner can delete workspace" }, 403);
  }

  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
  return c.json({ success: true });
});

// GET /workspaces/:workspaceId/members — list members
workspacesRouter.get("/:workspaceId/members", workspaceTenantMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId") as string;

  const members = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.workspaceId, workspaceId),
    with: { user: true },
  });

  return c.json(members);
});

// POST /workspaces/:workspaceId/members — invite member
workspacesRouter.post("/:workspaceId/members", workspaceTenantMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId") as string;
  const { userId: invitedUserId } = await c.req.json<{ userId: string }>();

  const existing = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, invitedUserId),
    ),
  });
  if (existing) return c.json({ error: "User is already a member" }, 409);

  const [member] = await db
    .insert(workspaceMembers)
    .values({ workspaceId, userId: invitedUserId, role: "member" })
    .returning();

  return c.json(member, 201);
});

// GET /workspaces/:workspaceId/responses — list all responses for the workspace
workspacesRouter.get("/:workspaceId/responses", workspaceTenantMiddleware, async (c) => {
  const workspaceId = c.get("workspaceId") as string;

  const workspaceTrainings = await db.select({ id: trainings.id }).from(trainings).where(and(eq(trainings.workspaceId, workspaceId), isNull(trainings.deletedAt)));
  const trainingIds = workspaceTrainings.map((t) => t.id);

  if (trainingIds.length === 0) return c.json([]);

  const responses = await db.query.participantResponses.findMany({
    where: inArray(participantResponses.trainingId, trainingIds),
    with: {
      user: true,
      training: true,
      module: true,
    },
    orderBy: (responses, { desc }) => [desc(responses.submittedAt)]
  });

  // Map over responses and attach day data from module
  const responseIds = responses.map(r => r.module?.id).filter(Boolean);
  let moduleDayMap: Record<string, typeof responses[0]["module"] & { day: any }> = {};

  if (responseIds.length > 0) {
    const modulesWithDays = await db.query.trainingModules.findMany({
      where: inArray(trainingModules.id, responseIds),
      with: { day: true },
    });
    moduleDayMap = Object.fromEntries(
      modulesWithDays.map(m => [m.id, { ...m, day: m.day }])
    );
  }

  const enrichedResponses = responses.map(r => ({
    ...r,
    module: r.module ? (moduleDayMap[r.module.id] || r.module) : null,
  }));

  return c.json(enrichedResponses);
});
