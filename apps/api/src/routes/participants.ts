import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { eq, and, inArray, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { trainingParticipants, trainings, participantResponses, users, trainingFacilitators } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { joinTokenToCode } from "@oruclass/utils";
import { ScratchpadUpdateSchema, JoinCodeSchema } from "@oruclass/validators";
import { parseBody } from "../utils/validators";
import { trainingInWorkspace } from "../utils/workspaceAssets";
import { sendParticipantJoinedEmail, sendAccountDeletedEmail } from "../services/email.service";

export const participantsRouter = new Hono<AppEnv>();

participantsRouter.use("*", authMiddleware);

// GET /trainings/:trainingId/participants — workspace-scoped
participantsRouter.get("/:trainingId/participants", workspaceTenantMiddleware, async (c) => {
  const { trainingId } = c.req.param();
  const workspaceId = c.get("workspaceId") as string;

  if (!(await trainingInWorkspace(trainingId, workspaceId))) {
    return c.json({ error: "Training not found in workspace" }, 404);
  }

  const participants = await db.query.trainingParticipants.findMany({
    where: eq(trainingParticipants.trainingId, trainingId),
    with: { user: true },
  });

  return c.json(participants);
});

// GET /facilitator/trainings — trainings shared with the current user as a facilitator
participantsRouter.get("/facilitator/trainings", async (c) => {
  const userId = c.get("userId") as string;

  const rows = await db.query.trainingFacilitators.findMany({
    where: eq(trainingFacilitators.userId, userId),
    with: {
      training: {
        with: { creator: true },
      },
    },
  });

  const list = rows
    .filter((r) => r.training && !r.training.deletedAt && r.training.createdBy !== userId)
    .map((r) => ({
      ...r.training,
      myRole: r.role,
      assignedModules: r.assignedModules,
    }));

  return c.json(list);
});

// GET /participant/sessions — get all trainings the user is participating in
participantsRouter.get("/participant/sessions", async (c) => {
  const userId = c.get("userId") as string;

  const participations = await db.query.trainingParticipants.findMany({
    where: eq(trainingParticipants.userId, userId),
    with: {
      training: {
        with: { creator: true },
      },
    },
    orderBy: (tp, { desc }) => [desc(tp.joinedAt)],
  });

  const trainingsList = participations.map((p) => ({
    ...p.training,
    participantJoinedAt: p.joinedAt,
    participantConnectionStatus: p.connectionStatus,
  }));

  return c.json(trainingsList);
});

// GET /participant/trainings/:id — get a specific training the user is participating in
participantsRouter.get("/participant/trainings/:id", async (c) => {
  const userId = c.get("userId") as string;
  const { id } = c.req.param();

  const participation = await db.query.trainingParticipants.findFirst({
    where: and(eq(trainingParticipants.userId, userId), eq(trainingParticipants.trainingId, id)),
    with: {
      training: {
        with: { creator: true, modules: { orderBy: (m, { asc }) => [asc(m.position)] } },
      },
    },
  });

  if (!participation) return c.json({ error: "Not found or not participating" }, 404);

  return c.json(participation.training);
});

// POST /join/code — look up a live training by 6-digit session code.
// We scan only live/connecting trainings, then compare the deterministic
// joinTokenToCode mapping in JS. Set is small in practice; if it grows
// hot, denormalize a session_code column on trainings with a partial index.
participantsRouter.post("/join/code", async (c) => {
  const { code } = await parseBody(c, JoinCodeSchema);

  const liveTrainings = await db.query.trainings.findMany({
    where: and(inArray(trainings.sessionStatus, ["live", "connecting"]), isNull(trainings.deletedAt)),
    columns: { joinToken: true },
  });

  const match = liveTrainings.find((t) => joinTokenToCode(t.joinToken) === code);
  if (!match) return c.json({ error: "No live session found with that code" }, 404);

  return c.json({ joinToken: match.joinToken });
});

// POST /join/:joinToken — public join via token
participantsRouter.post("/join/:joinToken", async (c) => {
  const { joinToken } = c.req.param();
  const userId = c.get("userId") as string;

  const training = await db.query.trainings.findFirst({
    where: and(eq(trainings.joinToken, joinToken), isNull(trainings.deletedAt)),
  });

  if (!training) return c.json({ error: "Training not found" }, 404);
  if (training.sessionStatus !== "live" && training.sessionStatus !== "connecting") {
    return c.json(
      { error: "Training is not accepting participants", sessionStatus: training.sessionStatus },
      400,
    );
  }

  // Upsert participant: insert if missing, mark online if returning.
  // Using ON CONFLICT keeps it one round-trip and atomic.
  await db
    .insert(trainingParticipants)
    .values({ trainingId: training.id, userId, connectionStatus: "online" })
    .onConflictDoUpdate({
      target: [trainingParticipants.trainingId, trainingParticipants.userId],
      set: { connectionStatus: "online", lastHeartbeat: new Date() },
    });

  // Send join confirmation email (fire-and-forget)
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (user?.email && user.name) {
    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
    const joinCode = joinTokenToCode(joinToken);
    sendParticipantJoinedEmail({
      to: user.email,
      participantName: user.name,
      trainingTitle: training.title,
      joinCode,
      joinUrl: `${webUrl}/join/${joinToken}`,
    }).catch((err) => console.error("[email] participant join email failed:", err));
  }

  return c.json({ training });
});

// POST /trainings/:trainingId/participants/heartbeat
participantsRouter.post("/:trainingId/participants/heartbeat", async (c) => {
  const { trainingId } = c.req.param();
  const userId = c.get("userId") as string;

  await db
    .update(trainingParticipants)
    .set({ lastHeartbeat: new Date(), connectionStatus: "online" })
    .where(
      and(
        eq(trainingParticipants.trainingId, trainingId),
        eq(trainingParticipants.userId, userId),
      ),
    );

  return c.json({ success: true });
});

// GET /:trainingId/participants/me/scratchpad
participantsRouter.get("/:trainingId/participants/me/scratchpad", async (c) => {
  const { trainingId } = c.req.param();
  const userId = c.get("userId") as string;

  const participation = await db.query.trainingParticipants.findFirst({
    where: and(
      eq(trainingParticipants.trainingId, trainingId),
      eq(trainingParticipants.userId, userId),
    ),
    columns: {
      personalNotes: true,
      personalWhiteboard: true,
    },
  });

  if (!participation) {
    return c.json({ error: "Not a participant in this training" }, 404);
  }

  return c.json(participation);
});

// GET /participant/trainings/:id/review — read-only review of a completed training
participantsRouter.get("/participant/trainings/:id/review", async (c) => {
  const userId = c.get("userId") as string;
  const { id } = c.req.param();

  // Verify participation
  const participation = await db.query.trainingParticipants.findFirst({
    where: and(eq(trainingParticipants.userId, userId), eq(trainingParticipants.trainingId, id)),
    columns: { personalNotes: true, personalWhiteboard: true, joinedAt: true },
  });

  if (!participation) return c.json({ error: "Not found or not participating" }, 404);

  // Fetch training with modules and facilitators
  const training = await db.query.trainings.findFirst({
    where: and(eq(trainings.id, id), isNull(trainings.deletedAt)),
    with: {
      creator: { columns: { id: true, name: true, email: true } },
      modules: { orderBy: (m, { asc }) => [asc(m.position)] },
      facilitators: {
        with: { user: { columns: { id: true, name: true, email: true } } },
      },
      days: { orderBy: (d, { asc }) => [asc(d.dayNumber)] },
    },
  });

  if (!training) return c.json({ error: "Training not found" }, 404);
  if (training.sessionStatus !== "completed") {
    return c.json({ error: "Training is still active" }, 400);
  }

  // Fetch participant's own responses
  const responses = await db.query.participantResponses.findMany({
    where: and(
      eq(participantResponses.trainingId, id),
      eq(participantResponses.userId, userId),
    ),
  });

  return c.json({
    training,
    responses,
    personalNotes: participation.personalNotes,
    personalWhiteboard: participation.personalWhiteboard,
    joinedAt: participation.joinedAt,
  });
});

// PUT /:trainingId/participants/me/scratchpad
participantsRouter.put("/:trainingId/participants/me/scratchpad", async (c) => {
  const { trainingId } = c.req.param();
  const userId = c.get("userId") as string;
  const body = await parseBody(c, ScratchpadUpdateSchema);

  const updateData: { personalNotes?: string; personalWhiteboard?: Record<string, unknown> } = {};
  if (body.personalNotes !== undefined) updateData.personalNotes = body.personalNotes;
  if (body.personalWhiteboard !== undefined) updateData.personalWhiteboard = body.personalWhiteboard;

  await db
    .update(trainingParticipants)
    .set(updateData)
    .where(
      and(
        eq(trainingParticipants.trainingId, trainingId),
        eq(trainingParticipants.userId, userId),
      ),
    );

  return c.json({ success: true });
});

// DELETE /account — delete current user's account
// TODO: cascade delete workspace memberships, facilitator roles, anonymize participant data,
//       add confirmation step (re-enter password), soft-delete with 30-day grace period
participantsRouter.delete("/account", async (c) => {
  const userId = c.get("userId") as string;

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return c.json({ error: "User not found" }, 404);

  await db.delete(users).where(eq(users.id, userId));

  if (user.email && user.name) {
    sendAccountDeletedEmail({ to: user.email, name: user.name }).catch(() => {});
  }

  return c.json({ success: true });
});
