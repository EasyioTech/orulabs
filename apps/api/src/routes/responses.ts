import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { participantResponses } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { moduleInWorkspace } from "../utils/workspaceAssets";
import { SUBMIT_RATE_MAX, SUBMIT_RATE_WINDOW_MS } from "../config/limits";

export const responsesRouter = new Hono<AppEnv>();

responsesRouter.use("*", authMiddleware);
responsesRouter.use("*", workspaceTenantMiddleware);

// Per-user submission throttle. Socket has its own bucket; HTTP path needs one too
// or it's a trivial bypass for unlimited submissions.
const submitBuckets = new Map<string, { count: number; resetAt: number }>();

function checkSubmitRate(userId: string): boolean {
  const now = Date.now();
  const b = submitBuckets.get(userId);
  if (!b || now > b.resetAt) {
    submitBuckets.set(userId, { count: 1, resetAt: now + SUBMIT_RATE_WINDOW_MS });
    return true;
  }
  b.count++;
  return b.count <= SUBMIT_RATE_MAX;
}

// POST /trainings/:trainingId/modules/:moduleId/responses
responsesRouter.post("/:trainingId/modules/:moduleId/responses", async (c) => {
  const { trainingId, moduleId } = c.req.param();
  const userId = c.get("userId") as string;
  const workspaceId = c.get("workspaceId") as string;

  if (!checkSubmitRate(userId)) {
    return c.json({ error: "Too many submissions" }, 429);
  }

  if (!(await moduleInWorkspace(trainingId, moduleId, workspaceId))) {
    return c.json({ error: "Module not found in workspace" }, 404);
  }

  const body = await c.req.json<{ responseData: Record<string, unknown> }>();

  // Upsert — one response per user per module
  const existing = await db.query.participantResponses.findFirst({
    where: and(
      eq(participantResponses.trainingId, trainingId),
      eq(participantResponses.moduleId, moduleId),
      eq(participantResponses.userId, userId),
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(participantResponses)
      .set({ responseData: body.responseData, submittedAt: new Date() })
      .where(eq(participantResponses.id, existing.id))
      .returning();
    return c.json(updated);
  }

  const [created] = await db
    .insert(participantResponses)
    .values({ trainingId, moduleId, userId, responseData: body.responseData })
    .returning();

  return c.json(created, 201);
});

// GET /trainings/:trainingId/modules/:moduleId/responses — aggregated (trainer only)
responsesRouter.get("/:trainingId/modules/:moduleId/responses", async (c) => {
  const { trainingId, moduleId } = c.req.param();
  const workspaceId = c.get("workspaceId") as string;

  if (!(await moduleInWorkspace(trainingId, moduleId, workspaceId))) {
    return c.json({ error: "Module not found in workspace" }, 404);
  }

  const responses = await db.query.participantResponses.findMany({
    where: and(
      eq(participantResponses.trainingId, trainingId),
      eq(participantResponses.moduleId, moduleId),
    ),
    with: { user: true },
  });

  return c.json(responses);
});

// GET /trainings/:trainingId/modules/:moduleId/responses/me — get current user's response
responsesRouter.get("/:trainingId/modules/:moduleId/responses/me", async (c) => {
  const { trainingId, moduleId } = c.req.param();
  const userId = c.get("userId") as string;
  const workspaceId = c.get("workspaceId") as string;

  if (!(await moduleInWorkspace(trainingId, moduleId, workspaceId))) {
    return c.json({ error: "Module not found in workspace" }, 404);
  }

  const response = await db.query.participantResponses.findFirst({
    where: and(
      eq(participantResponses.trainingId, trainingId),
      eq(participantResponses.moduleId, moduleId),
      eq(participantResponses.userId, userId),
    ),
  });

  return c.json(response || null);
});

// POST /trainings/:trainingId/modules/:moduleId/responses/:responseId/comments — trainer adds a comment
responsesRouter.post("/:trainingId/modules/:moduleId/responses/:responseId/comments", async (c) => {
  const { trainingId, moduleId, responseId } = c.req.param();
  const workspaceId = c.get("workspaceId") as string;
  const trainerName = c.get("userName") as string || "Trainer"; // Assume we can get trainer name or just use "Trainer"

  if (!(await moduleInWorkspace(trainingId, moduleId, workspaceId))) {
    return c.json({ error: "Module not found in workspace" }, 404);
  }

  const body = await c.req.json<{ text: string }>();

  const response = await db.query.participantResponses.findFirst({
    where: and(
      eq(participantResponses.id, responseId),
      eq(participantResponses.trainingId, trainingId)
    )
  });

  if (!response) {
    return c.json({ error: "Response not found" }, 404);
  }

  const existingData = response.responseData as Record<string, unknown> & {
    comments?: { id: string; text: string; trainerName: string; createdAt: string }[];
  };
  const comments = existingData.comments ?? [];

  comments.push({
    id: crypto.randomUUID(),
    text: body.text,
    trainerName,
    createdAt: new Date().toISOString(),
  });

  const [updated] = await db
    .update(participantResponses)
    .set({ responseData: { ...existingData, comments } })
    .where(eq(participantResponses.id, responseId))
    .returning();

  return c.json(updated);
});
