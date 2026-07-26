import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/client";
import { participantResponses, liveSessions } from "../db/schema";
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

/**
 * Get the current active liveSession ID for a training.
 * Returns null if no session is active.
 */
async function getActiveLiveSessionId(trainingId: string): Promise<string | null> {
  const session = await db.query.liveSessions.findFirst({
    where: and(eq(liveSessions.trainingId, trainingId), eq(liveSessions.status, "active")),
    orderBy: [desc(liveSessions.startedAt)],
    columns: { id: true },
  });
  return session?.id ?? null;
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

  // Scope the response to the CURRENT active live session.
  // If no session is active, we still allow saving (e.g., preview/test mode) but without a sessionId.
  const liveSessionId = await getActiveLiveSessionId(trainingId);

  // Upsert scoped to (trainingId, moduleId, userId, liveSessionId).
  // Using raw upsert on the composite unique index ensures a new session
  // always gets a fresh row instead of overwriting a previous session's answer.
  const [upserted] = await db
    .insert(participantResponses)
    .values({
      trainingId,
      moduleId,
      userId,
      responseData: body.responseData,
      liveSessionId: liveSessionId ?? undefined,
      startedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        participantResponses.trainingId,
        participantResponses.moduleId,
        participantResponses.userId,
      ],
      set: {
        responseData: body.responseData,
        submittedAt: new Date(),
        liveSessionId: liveSessionId ?? undefined,
      },
    })
    .returning();

  return c.json(upserted, 201);
});

// GET /trainings/:trainingId/modules/:moduleId/responses — aggregated (trainer only)
// Returns responses SCOPED to the current active session only so trainers don't see stale data.
responsesRouter.get("/:trainingId/modules/:moduleId/responses", async (c) => {
  const { trainingId, moduleId } = c.req.param();
  const workspaceId = c.get("workspaceId") as string;

  if (!(await moduleInWorkspace(trainingId, moduleId, workspaceId))) {
    return c.json({ error: "Module not found in workspace" }, 404);
  }

  // Only show responses for the current active live session.
  // This prevents old session data from bleeding into the trainer dashboard.
  const liveSessionId = await getActiveLiveSessionId(trainingId);

  const whereClause = liveSessionId
    ? and(
        eq(participantResponses.trainingId, trainingId),
        eq(participantResponses.moduleId, moduleId),
        eq(participantResponses.liveSessionId, liveSessionId),
      )
    : and(
        eq(participantResponses.trainingId, trainingId),
        eq(participantResponses.moduleId, moduleId),
      );

  const responses = await db.query.participantResponses.findMany({
    where: whereClause,
    with: { user: true },
  });

  return c.json(responses);
});

// GET /trainings/:trainingId/modules/:moduleId/responses/me — get current user's response
// CRITICAL: Must be scoped to the active session so participants don't see old answers pre-filled.
responsesRouter.get("/:trainingId/modules/:moduleId/responses/me", async (c) => {
  const { trainingId, moduleId } = c.req.param();
  const userId = c.get("userId") as string;
  const workspaceId = c.get("workspaceId") as string;

  if (!(await moduleInWorkspace(trainingId, moduleId, workspaceId))) {
    return c.json({ error: "Module not found in workspace" }, 404);
  }

  // Scope to the current active live session.
  // Without this, starting a new session would show the participant their old answer pre-filled,
  // and submitting would overwrite the old session's record.
  const liveSessionId = await getActiveLiveSessionId(trainingId);

  const whereClause = liveSessionId
    ? and(
        eq(participantResponses.trainingId, trainingId),
        eq(participantResponses.moduleId, moduleId),
        eq(participantResponses.userId, userId),
        eq(participantResponses.liveSessionId, liveSessionId),
      )
    : and(
        eq(participantResponses.trainingId, trainingId),
        eq(participantResponses.moduleId, moduleId),
        eq(participantResponses.userId, userId),
      );

  const response = await db.query.participantResponses.findFirst({
    where: whereClause,
  });

  return c.json(response || null);
});

// POST /trainings/:trainingId/modules/:moduleId/responses/:responseId/comments — trainer adds a comment
responsesRouter.post("/:trainingId/modules/:moduleId/responses/:responseId/comments", async (c) => {
  const { trainingId, moduleId, responseId } = c.req.param();
  const workspaceId = c.get("workspaceId") as string;
  const trainerName = c.get("userName") as string || "Trainer";

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
