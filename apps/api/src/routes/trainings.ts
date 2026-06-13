import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { eq, and, sql, isNull, isNotNull, ne } from "drizzle-orm";
import { db } from "../db/client";
import { trainings, trainingFacilitators, trainingFacilitatorInvitations, trainingModules, trainingDays, users } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { requireTrainingPermission, invalidateRoleCache } from "../middleware/roleGuard";
import {
  CreateTrainingSchema,
  UpdateTrainingSchema,
  AssignFacilitatorSchema,
  FacilitatorInviteSchema,
  SessionStatusSchema,
} from "@oruclass/validators";
import {
  sendTrainingInviteEmail,
  sendParticipantCertificateEmail,
  sendJoinReminderEmail,
} from "../services/email.service";
import { parseBody } from "../utils/validators";
import { randomBytes } from "crypto";
import { getIO } from "../socket/io-instance";
import { digestQueue } from "../jobs/sendSessionDigest.job";

export const trainingsRouter = new Hono<AppEnv>();

trainingsRouter.use("*", authMiddleware);
trainingsRouter.use("*", workspaceTenantMiddleware);

function generateJoinToken(): string {
  return randomBytes(12).toString("base64url");
}

const DAY_MS = 86_400_000;
const MAX_AUTO_DAYS = 60; // safety cap so a huge/typo'd range can't spawn thousands of days

/** Inclusive whole-day span between two UTC-midnight dates, clamped to [1, MAX_AUTO_DAYS]. */
function spanDays(start: Date, end: Date | null): number {
  if (!end) return 1;
  const diff = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
  return Math.min(Math.max(diff, 1), MAX_AUTO_DAYS);
}

/** start + n calendar days, preserving the UTC-midnight anchor the date inputs produce. */
function addDays(start: Date, n: number): Date {
  return new Date(start.getTime() + n * DAY_MS);
}

// GET /trainings
trainingsRouter.get("/", async (c) => {
  const workspaceId = c.get("workspaceId") as string;

  const rows = await db.query.trainings.findMany({
    where: and(eq(trainings.workspaceId, workspaceId), isNull(trainings.deletedAt)),
    with: {
      creator: true,
      modules: true,
      days: { orderBy: (d, { asc }) => [asc(d.dayNumber)] }
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return c.json(rows);
});

// POST /trainings
trainingsRouter.post("/", async (c) => {
  const workspaceId = c.get("workspaceId") as string;
  const userId = c.get("userId") as string;
  const body = await parseBody(c, CreateTrainingSchema);

  const [training] = await db
    .insert(trainings)
    .values({
      workspaceId,
      title: body.title,
      labels: body.labels,
      type: body.type,
      description: body.description,
      venue: body.venue,
      meetingLink: body.meetingLink,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      joinToken: generateJoinToken(),
      createdBy: userId,
    })
    .returning();

  // Creator is automatically lead_trainer
  await db.insert(trainingFacilitators).values({
    trainingId: training.id,
    userId,
    role: "lead_trainer",
    assignedModules: [],
  });

  // Auto-generate one dated day per calendar date in the range so a multi-day
  // training is ready to plan without manual "Add Day" clicks. Each day inherits
  // the training's delivery mode and owns its own Attendance module. Falls back
  // to a single Day 1 when no start date was given.
  const start = training.startDate;
  const dayCount = start ? spanDays(start, training.endDate) : 1;

  for (let i = 0; i < dayCount; i++) {
    const [day] = await db
      .insert(trainingDays)
      .values({
        trainingId: training.id,
        dayNumber: i + 1,
        title: `Day ${i + 1}`,
        date: start ? addDays(start, i) : null,
        deliveryMode: training.type,
      })
      .returning();

    // Every day owns a default Attendance module — editable/deletable.
    await db.insert(trainingModules).values({
      trainingId: training.id,
      dayId: day.id,
      title: "Attendance",
      moduleType: "attendance",
      position: 0,
      isAlwaysOn: true,
      config: {},
    });
  }

  return c.json(training, 201);
});

// GET /trainings/trash (list deleted trainings)
trainingsRouter.get("/trash", async (c) => {
  const workspaceId = c.get("workspaceId") as string;

  const rows = await db.query.trainings.findMany({
    where: and(eq(trainings.workspaceId, workspaceId), isNotNull(trainings.deletedAt)),
    with: {
      creator: true,
      modules: true,
      days: { orderBy: (d, { asc }) => [asc(d.dayNumber)] }
    },
    orderBy: (t, { desc }) => [desc(t.deletedAt)],
  });

  return c.json(rows);
});

// GET /trainings/:id
trainingsRouter.get("/:id", async (c) => {
  const workspaceId = c.get("workspaceId") as string;
  const { id } = c.req.param();

  const training = await db.query.trainings.findFirst({
    where: and(
      eq(trainings.id, id),
      eq(trainings.workspaceId, workspaceId),
      isNull(trainings.deletedAt)
    ),
    with: {
      modules: { orderBy: (m, { asc }) => [asc(m.position)] },
      facilitators: { with: { user: true } },
      participants: { with: { user: true } },
      pendingInvitations: {
        where: (inv, { ne }) => ne(inv.status, "accepted"),
      },
    },
  });

  if (!training) return c.json({ error: "Not found" }, 404);
  return c.json(training);
});

// PATCH /trainings/:id
trainingsRouter.patch(
  "/:id",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const workspaceId = c.get("workspaceId") as string;
    const { id } = c.req.param();
    const body = await parseBody(c, UpdateTrainingSchema);

    const [updated] = await db
      .update(trainings)
      .set({
        ...body,
        venue: body.venue,
        meetingLink: body.meetingLink,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(trainings.id, id), eq(trainings.workspaceId, workspaceId)))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);

    // When the start date moves, shift each existing day's date to keep the
    // sequence aligned (Day N → start + (N-1)). Non-destructive: only re-dates
    // existing days, never adds/removes them or touches titles/modules — so a
    // trainer never loses planned content by editing the date.
    if (body.startDate && updated.startDate) {
      const days = await db.query.trainingDays.findMany({
        where: eq(trainingDays.trainingId, id),
        orderBy: (d, { asc }) => [asc(d.dayNumber)],
      });
      for (const [i, day] of days.entries()) {
        await db
          .update(trainingDays)
          .set({ date: addDays(updated.startDate, i), updatedAt: new Date() })
          .where(eq(trainingDays.id, day.id));
      }
    }

    return c.json(updated);
  },
);

// DELETE /trainings/:id (soft delete to trash)
trainingsRouter.delete(
  "/:id",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const workspaceId = c.get("workspaceId") as string;
    const { id } = c.req.param();

    await db
      .update(trainings)
      .set({ deletedAt: new Date() })
      .where(and(eq(trainings.id, id), eq(trainings.workspaceId, workspaceId)));

    return c.json({ success: true });
  },
);

// PATCH /trainings/:id/restore (restore from trash)
trainingsRouter.patch(
  "/:id/restore",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const workspaceId = c.get("workspaceId") as string;
    const { id } = c.req.param();

    const [restored] = await db
      .update(trainings)
      .set({ deletedAt: null })
      .where(and(eq(trainings.id, id), eq(trainings.workspaceId, workspaceId)))
      .returning();

    if (!restored) return c.json({ error: "Training not found" }, 404);
    return c.json(restored);
  },
);

// POST /trainings/:id/facilitators — assign facilitator role
trainingsRouter.post(
  "/:id/facilitators",
  requireTrainingPermission("assign_roles"),
  async (c) => {
    const { id: trainingId } = c.req.param();
    const body = await parseBody(c, AssignFacilitatorSchema);

    const existing = await db.query.trainingFacilitators.findFirst({
      where: and(
        eq(trainingFacilitators.trainingId, trainingId),
        eq(trainingFacilitators.userId, body.userId),
      ),
    });

    if (existing) {
      const [updated] = await db
        .update(trainingFacilitators)
        .set({ role: body.role, assignedModules: body.assignedModules })
        .where(
          and(
            eq(trainingFacilitators.trainingId, trainingId),
            eq(trainingFacilitators.userId, body.userId),
          ),
        )
        .returning();
      invalidateRoleCache(body.userId, trainingId);
      return c.json(updated);
    }

    const [created] = await db
      .insert(trainingFacilitators)
      .values({ trainingId, ...body })
      .returning();

    invalidateRoleCache(body.userId, trainingId);
    return c.json(created, 201);
  },
);

// POST /trainings/:id/facilitators/invite — invite facilitator by email (pending if not yet signed up)
trainingsRouter.post(
  "/:id/facilitators/invite",
  requireTrainingPermission("invite_participants"),
  async (c) => {
    const { id: trainingId } = c.req.param();
    const body = await parseBody(c, FacilitatorInviteSchema);
    const inviterId = c.get("userId") as string;

    const user = await db.query.users.findFirst({ where: eq(users.email, body.email) });

    if (user) {
      // Existing user: direct assignment
      const existing = await db.query.trainingFacilitators.findFirst({
        where: and(eq(trainingFacilitators.trainingId, trainingId), eq(trainingFacilitators.userId, user.id)),
      });
      if (existing) {
        const [updated] = await db
          .update(trainingFacilitators)
          .set({ role: body.role, assignedModules: [] })
          .where(and(eq(trainingFacilitators.trainingId, trainingId), eq(trainingFacilitators.userId, user.id)))
          .returning();
        invalidateRoleCache(user.id, trainingId);
        return c.json(updated);
      }
      const [created] = await db
        .insert(trainingFacilitators)
        .values({ trainingId, userId: user.id, role: body.role, assignedModules: [] })
        .returning();
      invalidateRoleCache(user.id, trainingId);
      const inviter = await db.query.users.findFirst({ where: eq(users.id, inviterId) });
      const training = await db.query.trainings.findFirst({ where: eq(trainings.id, trainingId) });
      if (training) {
        const { sendFacilitatorInviteEmail } = await import("../services/email.service");
        const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
        sendFacilitatorInviteEmail({
          to: body.email,
          inviterName: inviter?.name ?? "A teammate",
          trainingTitle: training.title,
          role: body.role,
          joinUrl: `${webUrl}/trainings/${trainingId}/studio`,
        }).catch((err) => console.error("[email] facilitator invite failed:", err));
      }
      return c.json(created, 201);
    }

    // Not a registered user: create pending invitation
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Cancel any existing pending invite for this email+training before creating new one
    await db
      .update(trainingFacilitatorInvitations)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(trainingFacilitatorInvitations.trainingId, trainingId),
          eq(trainingFacilitatorInvitations.email, body.email),
          eq(trainingFacilitatorInvitations.status, "pending"),
        ),
      );

    const [invitation] = await db
      .insert(trainingFacilitatorInvitations)
      .values({ trainingId, email: body.email, role: body.role, token, invitedBy: inviterId, expiresAt })
      .returning();

    const inviter = await db.query.users.findFirst({ where: eq(users.id, inviterId) });
    const training = await db.query.trainings.findFirst({ where: eq(trainings.id, trainingId) });
    if (training) {
      const { sendFacilitatorPendingInviteEmail } = await import("../services/email.service");
      const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
      sendFacilitatorPendingInviteEmail({
        to: body.email,
        inviterName: inviter?.name ?? "A teammate",
        trainingTitle: training.title,
        role: body.role,
        acceptUrl: `${webUrl}/trainings/invite/${token}`,
      }).catch((err) => console.error("[email] pending facilitator invite failed:", err));
    }

    return c.json({ pending: true, ...invitation }, 201);
  },
);

// DELETE /trainings/:id/facilitators/invitations/:invitationId — cancel pending invite
trainingsRouter.delete(
  "/:id/facilitators/invitations/:invitationId",
  requireTrainingPermission("invite_participants"),
  async (c) => {
    const { invitationId } = c.req.param();
    await db
      .update(trainingFacilitatorInvitations)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(trainingFacilitatorInvitations.id, invitationId),
          eq(trainingFacilitatorInvitations.status, "pending"),
        ),
      );
    return c.json({ success: true });
  },
);

// POST /trainings/:id/facilitators/invitations/:invitationId/resend — resend cancelled/declined invite
trainingsRouter.post(
  "/:id/facilitators/invitations/:invitationId/resend",
  requireTrainingPermission("invite_participants"),
  async (c) => {
    const { invitationId } = c.req.param();
    const inviterId = c.get("userId") as string;

    const invitation = await db.query.trainingFacilitatorInvitations.findFirst({
      where: eq(trainingFacilitatorInvitations.id, invitationId),
      with: { training: true },
    });

    if (!invitation) return c.json({ error: "Invitation not found" }, 404);
    if (invitation.status === "accepted") return c.json({ error: "Invitation already accepted" }, 400);

    const newToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db
      .update(trainingFacilitatorInvitations)
      .set({ token: newToken, expiresAt, status: "pending" })
      .where(eq(trainingFacilitatorInvitations.id, invitationId));

    const inviter = await db.query.users.findFirst({ where: eq(users.id, inviterId) });
    const { sendFacilitatorPendingInviteEmail } = await import("../services/email.service");
    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
    sendFacilitatorPendingInviteEmail({
      to: invitation.email,
      inviterName: inviter?.name ?? "A teammate",
      trainingTitle: (invitation as { training: { title: string } } & typeof invitation).training.title,
      role: invitation.role,
      acceptUrl: `${webUrl}/trainings/invite/${newToken}`,
    }).catch((err) => console.error("[email] facilitator resend failed:", err));

    return c.json({ success: true });
  },
);

// PATCH /trainings/:id/status — start/end session
trainingsRouter.patch(
  "/:id/status",
  requireTrainingPermission("pause_room"),
  async (c) => {
    const workspaceId = c.get("workspaceId") as string;
    const { id } = c.req.param();
    const { status } = await parseBody(c, SessionStatusSchema);

    // Atomic check-and-set: lock conflicting rows FOR UPDATE inside the tx
    // so two concurrent activations cannot both pass the "no other active" check.
    const activating = ["connecting", "live", "paused"].includes(status);
    let conflict = false;
    const updated = await db.transaction(async (tx) => {
      if (activating) {
        const locked = await tx.execute(sql`
          SELECT id FROM ${trainings}
          WHERE workspace_id = ${workspaceId}
            AND id <> ${id}
            AND session_status IN ('connecting', 'live', 'paused')
          FOR UPDATE
        `);
        const rows = (locked as unknown as { rows?: unknown[] }).rows ?? (locked as unknown as unknown[]);
        if (Array.isArray(rows) && rows.length > 0) {
          conflict = true;
          return null;
        }
      }
      const [row] = await tx
        .update(trainings)
        .set({ sessionStatus: status, updatedAt: new Date() })
        .where(and(eq(trainings.id, id), eq(trainings.workspaceId, workspaceId)))
        .returning();
      return row ?? null;
    });

    if (conflict) {
      return c.json(
        { error: "Another session is already active in this workspace. Please stop it first." },
        409,
      );
    }

    if (updated) {
      // Create live session when opening/starting
      const { liveSessions } = await import("../db/schema");
      const userId = c.get("userId") as string;

      const { bustLiveSessionCache } = await import("../socket/handlers");
      if (status === "connecting") {
        // Finalize any lingering active session first
        await db
          .update(liveSessions)
          .set({ status: "completed", endedAt: new Date() })
          .where(and(eq(liveSessions.trainingId, id), eq(liveSessions.status, "active")));
        // Create new session
        await db.insert(liveSessions).values({ trainingId: id, createdBy: userId });
        bustLiveSessionCache(id);
        getIO().to(`training:${id}`).emit("session:resumed");
      } else if (status === "paused") {
        getIO().to(`training:${id}`).emit("session:paused");
      } else if (status === "live") {
        getIO().to(`training:${id}`).emit("session:started");
      } else if (status === "completed") {
        await db
          .update(liveSessions)
          .set({ status: "completed", endedAt: new Date() })
          .where(and(eq(liveSessions.trainingId, id), eq(liveSessions.status, "active")));
        bustLiveSessionCache(id);
        getIO().to(`training:${id}`).emit("session:ended");

        // Queue digest email to trainer
        const { trainingParticipants } = await import("../db/schema");
        const trainer = await db.query.users.findFirst({ where: eq(users.id, userId) });
        const participantRows = await db.select().from(trainingParticipants).where(eq(trainingParticipants.trainingId, id));
        const moduleRows = await db.select().from(trainingModules).where(eq(trainingModules.trainingId, id));
        if (trainer?.email) {
          const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
          digestQueue.add("digest", {
            to: trainer.email,
            trainingTitle: updated.title,
            participantCount: participantRows.length,
            moduleCount: moduleRows.length,
            completedAt: new Date().toISOString(),
            analyticsUrl: `${webUrl}/trainings/${id}/analytics`,
          }).catch((err) => console.error("[digest] queue failed:", err));
        }
      }
    }

    return c.json(updated);
  },
);

// POST /trainings/:id/reset — reset completed session to draft
trainingsRouter.post(
  "/:id/reset",
  requireTrainingPermission("pause_room"),
  async (c) => {
    const workspaceId = c.get("workspaceId") as string;
    const { id } = c.req.param();

    const { trainingModules } = await import("../db/schema");
    const { getOrCreateState, persistState } = await import("../socket/state");

    await db
      .update(trainingModules)
      .set({ isUnlocked: false, updatedAt: new Date() })
      .where(eq(trainingModules.trainingId, id));

    const [updated] = await db
      .update(trainings)
      .set({ sessionStatus: "draft", currentActiveModuleId: null, updatedAt: new Date() })
      .where(and(eq(trainings.id, id), eq(trainings.workspaceId, workspaceId)))
      .returning();

    if (updated) {
      // Finalize current live session on reset
      const { liveSessions } = await import("../db/schema");
      await db
        .update(liveSessions)
        .set({ status: "completed", endedAt: new Date() })
        .where(and(eq(liveSessions.trainingId, id), eq(liveSessions.status, "active")));

      const { bustLiveSessionCache } = await import("../socket/handlers");
      bustLiveSessionCache(id);

      // Clear socket state
      const state = getOrCreateState(id);
      state.activeModuleId = null;
      await persistState(id);

      getIO().to(`training:${id}`).emit("session:reset");
      getIO().to(`training:${id}`).emit("module:unlocked", { moduleId: null, module: null });
    }

    return c.json(updated);
  },
);

// POST /trainings/:id/invite-participant — invite participant by email
// TODO: bulk invite, save invites to DB for tracking, rate limit per training
trainingsRouter.post(
  "/:id/invite-participant",
  requireTrainingPermission("invite_participants"),
  async (c) => {
    const { id: trainingId } = c.req.param();
    const { email } = await c.req.json<{ email: string }>();
    if (!email) return c.json({ error: "email required" }, 400);

    const training = await db.query.trainings.findFirst({ where: eq(trainings.id, trainingId) });
    if (!training) return c.json({ error: "Training not found" }, 404);

    const inviterId = c.get("userId") as string;
    const inviter = await db.query.users.findFirst({ where: eq(users.id, inviterId) });
    const { joinTokenToCode } = await import("@oruclass/utils");
    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

    await sendTrainingInviteEmail({
      to: email,
      trainerName: inviter?.name ?? "A trainer",
      trainingTitle: training.title,
      joinCode: joinTokenToCode(training.joinToken),
      joinUrl: `${webUrl}/join/${training.joinToken}`,
      scheduledAt: training.startDate ? new Date(training.startDate).toLocaleDateString("en-IN", { dateStyle: "medium" }) : undefined,
    });

    return c.json({ success: true });
  },
);

// POST /trainings/:id/send-reminder — send join reminder to a participant email
// TODO: cron-based auto-reminders before session start, batch to all participants
trainingsRouter.post(
  "/:id/send-reminder",
  requireTrainingPermission("invite_participants"),
  async (c) => {
    const { id: trainingId } = c.req.param();
    const { email } = await c.req.json<{ email: string }>();
    if (!email) return c.json({ error: "email required" }, 400);

    const training = await db.query.trainings.findFirst({ where: eq(trainings.id, trainingId) });
    if (!training) return c.json({ error: "Training not found" }, 404);

    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

    await sendJoinReminderEmail({
      to: email,
      trainingTitle: training.title,
      scheduledAt: training.startDate ? new Date(training.startDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "TBD",
      joinUrl: `${webUrl}/join/${training.joinToken}`,
    });

    return c.json({ success: true });
  },
);

// POST /trainings/:id/send-certificate — send certificate email to participant
// TODO: generate PDF certificate, store in S3, link to download, batch send to all participants
trainingsRouter.post(
  "/:id/send-certificate",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { id: trainingId } = c.req.param();
    const { email, participantName } = await c.req.json<{ email: string; participantName: string }>();
    if (!email || !participantName) return c.json({ error: "email and participantName required" }, 400);

    const training = await db.query.trainings.findFirst({ where: eq(trainings.id, trainingId) });
    if (!training) return c.json({ error: "Training not found" }, 404);

    const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

    await sendParticipantCertificateEmail({
      to: email,
      participantName,
      trainingTitle: training.title,
      certificateUrl: `${webUrl}/participant/training/${trainingId}/certificate`,
    });

    return c.json({ success: true });
  },
);
