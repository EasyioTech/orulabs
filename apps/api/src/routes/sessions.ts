import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { eq, and, count, sql, desc, inArray, isNull } from "drizzle-orm";
import { db } from "../db/client";
import {
  liveSessions,
  trainingParticipants,
  participantResponses,
  trainings,
} from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";

export const sessionsRouter = new Hono<AppEnv>();

sessionsRouter.use("*", authMiddleware);
sessionsRouter.use("*", workspaceTenantMiddleware);

// Verifies the training in the URL belongs to the workspace the caller is asserting.
// Returns the training row, or null if it does not match.
async function trainingInWorkspace(trainingId: string, workspaceId: string) {
  return db.query.trainings.findFirst({
    where: and(eq(trainings.id, trainingId), eq(trainings.workspaceId, workspaceId), isNull(trainings.deletedAt)),
    columns: { id: true, workspaceId: true },
  });
}

// GET /trainings/:trainingId/sessions — session history
sessionsRouter.get("/:trainingId/sessions", async (c) => {
  const { trainingId } = c.req.param();
  const workspaceId = c.get("workspaceId") as string;

  if (!(await trainingInWorkspace(trainingId, workspaceId))) {
    return c.json({ error: "Training not found in workspace" }, 404);
  }

  const sessions = await db.query.liveSessions.findMany({
    where: eq(liveSessions.trainingId, trainingId),
    orderBy: [desc(liveSessions.startedAt)],
  });

  if (sessions.length === 0) return c.json([]);

  // Single aggregation query for both total + unique counts across all sessions
  const sessionIds = sessions.map((s) => s.id);
  const stats = await db
    .select({
      liveSessionId: participantResponses.liveSessionId,
      total: count(),
      unique: sql<number>`COUNT(DISTINCT ${participantResponses.userId})`,
    })
    .from(participantResponses)
    .where(inArray(participantResponses.liveSessionId, sessionIds))
    .groupBy(participantResponses.liveSessionId);

  const statsMap = new Map(stats.map((s) => [s.liveSessionId, s]));
  const enriched = sessions.map((s) => {
    const row = statsMap.get(s.id);
    return {
      ...s,
      totalResponses: row ? Number(row.total) : 0,
      uniqueRespondents: row ? Number(row.unique) : 0,
    };
  });

  return c.json(enriched);
});

// GET /trainings/:trainingId/sessions/current — current active session + stats
sessionsRouter.get("/:trainingId/sessions/current", async (c) => {
  const { trainingId } = c.req.param();
  const workspaceId = c.get("workspaceId") as string;

  if (!(await trainingInWorkspace(trainingId, workspaceId))) {
    return c.json({ error: "Training not found in workspace" }, 404);
  }

  const session = await db.query.liveSessions.findFirst({
    where: and(eq(liveSessions.trainingId, trainingId), eq(liveSessions.status, "active")),
    orderBy: [desc(liveSessions.startedAt)],
  });

  if (!session) return c.json({ session: null, stats: null });

  // Get current active module
  const training = await db.query.trainings.findFirst({
    where: and(eq(trainings.id, trainingId), isNull(trainings.deletedAt)),
    columns: { currentActiveModuleId: true },
  });

  const moduleId = training?.currentActiveModuleId;

  let submitted = 0;
  if (moduleId) {
    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(participantResponses)
      .where(
        and(
          eq(participantResponses.liveSessionId, session.id),
          eq(participantResponses.moduleId, moduleId),
        ),
      );
    submitted = Number(cnt);
  }

  const [{ totalPx }] = await db
    .select({ totalPx: count() })
    .from(trainingParticipants)
    .where(eq(trainingParticipants.trainingId, trainingId));

  const total = Number(totalPx);

  return c.json({
    session,
    stats: {
      sessionId: session.id,
      submitted,
      totalParticipants: total,
      completionPct: total > 0 ? Math.round((submitted / total) * 100) : 0,
      targetResponses: session.targetResponses,
    },
  });
});

// PATCH /trainings/:trainingId/sessions/current — update target responses
sessionsRouter.patch("/:trainingId/sessions/current", async (c) => {
  const { trainingId } = c.req.param();
  const workspaceId = c.get("workspaceId") as string;
  const { targetResponses } = await c.req.json<{ targetResponses: number | null }>();

  if (!(await trainingInWorkspace(trainingId, workspaceId))) {
    return c.json({ error: "Training not found in workspace" }, 404);
  }

  const session = await db.query.liveSessions.findFirst({
    where: and(eq(liveSessions.trainingId, trainingId), eq(liveSessions.status, "active")),
  });

  if (!session) return c.json({ error: "No active session" }, 404);

  const [updated] = await db
    .update(liveSessions)
    .set({ targetResponses })
    .where(eq(liveSessions.id, session.id))
    .returning();

  return c.json(updated);
});

// GET /trainings/:trainingId/sessions/:sessionId/participants?moduleId=&page=&limit=
sessionsRouter.get("/:trainingId/sessions/:sessionId/participants", async (c) => {
  const { trainingId, sessionId } = c.req.param();
  const workspaceId = c.get("workspaceId") as string;
  const moduleId = c.req.query("moduleId");

  if (!(await trainingInWorkspace(trainingId, workspaceId))) {
    return c.json({ error: "Training not found in workspace" }, 404);
  }

  const pageRaw = Number(c.req.query("page") ?? 1);
  const limitRaw = Number(c.req.query("limit") ?? 20);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 50) : 20;
  const offset = (page - 1) * limit;

  const participants = await db.query.trainingParticipants.findMany({
    where: eq(trainingParticipants.trainingId, trainingId),
    with: { user: true },
    limit,
    offset,
  });

  // Fetch all responses for this page in a single query, then attach in memory.
  let responseByUser = new Map<string, { id: string; submittedAt: Date | null }>();
  if (moduleId && participants.length > 0) {
    const userIds = participants.map((p) => p.userId);
    const responses = await db
      .select({
        id: participantResponses.id,
        userId: participantResponses.userId,
        submittedAt: participantResponses.submittedAt,
      })
      .from(participantResponses)
      .where(
        and(
          eq(participantResponses.liveSessionId, sessionId),
          eq(participantResponses.moduleId, moduleId),
          inArray(participantResponses.userId, userIds),
        ),
      );
    responseByUser = new Map(
      responses.map((r) => [r.userId, { id: r.id, submittedAt: r.submittedAt }]),
    );
  }

  const items = participants.map((p) => {
    const response = responseByUser.get(p.userId);
    return {
      userId: p.userId,
      name: (p.user as { name: string }).name,
      avatarUrl: (p.user as { avatarUrl: string | null }).avatarUrl ?? null,
      hasSubmitted: !!response,
      submittedAt: response?.submittedAt?.toISOString() ?? null,
      responseId: response?.id ?? null,
    };
  });

  items.sort((a, b) => {
    if (a.hasSubmitted && !b.hasSubmitted) return -1;
    if (!a.hasSubmitted && b.hasSubmitted) return 1;
    return a.name.localeCompare(b.name);
  });

  const [{ total }] = await db
    .select({ total: count() })
    .from(trainingParticipants)
    .where(eq(trainingParticipants.trainingId, trainingId));

  return c.json({ items, total: Number(total), page, limit });
});

// GET /trainings/:trainingId/sessions/:sessionId/participants/:userId/response?moduleId=
sessionsRouter.get("/:trainingId/sessions/:sessionId/participants/:userId/response", async (c) => {
  const { trainingId, sessionId, userId } = c.req.param();
  const workspaceId = c.get("workspaceId") as string;
  const moduleId = c.req.query("moduleId");

  if (!moduleId) return c.json({ error: "moduleId required" }, 400);
  if (!(await trainingInWorkspace(trainingId, workspaceId))) {
    return c.json({ error: "Training not found in workspace" }, 404);
  }

  const response = await db.query.participantResponses.findFirst({
    where: and(
      eq(participantResponses.liveSessionId, sessionId),
      eq(participantResponses.moduleId, moduleId),
      eq(participantResponses.userId, userId),
    ),
    with: { user: true },
  });

  if (!response) return c.json({ error: "Not found" }, 404);
  return c.json(response);
});

export { trainingInWorkspace };
