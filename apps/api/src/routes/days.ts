import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { eq, and, asc, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { trainingDays, trainingModules } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { requireTrainingPermission } from "../middleware/roleGuard";
import {
  CreateDaySchema,
  UpdateDaySchema,
  ReorderDaysSchema,
  AssignModuleToDaySchema,
} from "@oruclass/validators";
import { parseBody } from "../utils/validators";

export const daysRouter = new Hono<AppEnv>();

daysRouter.use("*", authMiddleware);
daysRouter.use("*", workspaceTenantMiddleware);

// GET /:trainingId/days — list days with their modules
daysRouter.get("/:trainingId/days", async (c) => {
  const { trainingId } = c.req.param();

  const days = await db.query.trainingDays.findMany({
    where: eq(trainingDays.trainingId, trainingId),
    orderBy: [asc(trainingDays.dayNumber)],
    with: {
      modules: {
        orderBy: [asc(trainingModules.position)],
      },
    },
  });

  return c.json(days);
});

// POST /:trainingId/days — create a new day
daysRouter.post(
  "/:trainingId/days",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId } = c.req.param();
    const body = await parseBody(c, CreateDaySchema);

    // Wrap in transaction so two concurrent inserts with the same dayNumber
    // can't both pass the unique check; the loser surfaces a 409 cleanly.
    try {
      const day = await db.transaction(async (tx) => {
        const [newDay] = await tx
          .insert(trainingDays)
          .values({ trainingId, ...body, date: body.date ? new Date(body.date) : null })
          .returning();

        // Every day must own an Attendance module. Adopt any unassigned
        // attendance into this day (covers the auto-created one from training
        // creation); otherwise spawn a fresh attendance row at position 0.
        const adopted = await tx
          .update(trainingModules)
          .set({ dayId: newDay.id, updatedAt: new Date() })
          .where(
            and(
              eq(trainingModules.trainingId, trainingId),
              eq(trainingModules.moduleType, "attendance"),
              isNull(trainingModules.dayId),
            ),
          )
          .returning({ id: trainingModules.id });

        if (adopted.length === 0) {
          // Find the first attendance module for this training to copy its config
          const existingAttendance = await tx.query.trainingModules.findFirst({
            where: and(
              eq(trainingModules.trainingId, trainingId),
              eq(trainingModules.moduleType, "attendance")
            ),
            orderBy: [asc(trainingModules.createdAt)]
          });

          await tx.insert(trainingModules).values({
            trainingId,
            dayId: newDay.id,
            title: existingAttendance?.title || "Attendance",
            moduleType: "attendance",
            position: 0,
            isAlwaysOn: true,
            config: existingAttendance?.config || {},
          });
        }

        return newDay;
      });
      return c.json(day, 201);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "23505") {
        return c.json({ error: "Day number already exists" }, 409);
      }
      throw err;
    }
  },
);

// PATCH /:trainingId/days/:dayId — update title, date, description
daysRouter.patch(
  "/:trainingId/days/:dayId",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId, dayId } = c.req.param();
    const body = await parseBody(c, UpdateDaySchema);

    const patch: Record<string, unknown> = { ...body, updatedAt: new Date() };
    if (body.date !== undefined) patch.date = body.date ? new Date(body.date) : null;

    const [updated] = await db
      .update(trainingDays)
      .set(patch)
      .where(and(eq(trainingDays.id, dayId), eq(trainingDays.trainingId, trainingId)))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  },
);

// DELETE /:trainingId/days/:dayId — delete day (modules get day_id = null via SET NULL cascade)
daysRouter.delete(
  "/:trainingId/days/:dayId",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId, dayId } = c.req.param();

    await db.transaction(async (tx) => {
      const existing = await tx.query.trainingDays.findFirst({
        where: and(eq(trainingDays.id, dayId), eq(trainingDays.trainingId, trainingId)),
      });
      if (!existing) {
        throw Object.assign(new Error("Not found"), { status: 404 });
      }

      await tx
        .delete(trainingDays)
        .where(and(eq(trainingDays.id, dayId), eq(trainingDays.trainingId, trainingId)));

      // Re-sequence inside the same tx. Two-pass with negative offset avoids
      // colliding against the (trainingId, dayNumber) unique constraint mid-update.
      const remaining = await tx.query.trainingDays.findMany({
        where: eq(trainingDays.trainingId, trainingId),
        orderBy: [asc(trainingDays.dayNumber)],
      });

      for (const [i, d] of remaining.entries()) {
        await tx
          .update(trainingDays)
          .set({ dayNumber: -(i + 1), updatedAt: new Date() })
          .where(eq(trainingDays.id, d.id));
      }
      for (const [i, d] of remaining.entries()) {
        await tx
          .update(trainingDays)
          .set({ dayNumber: i + 1, updatedAt: new Date() })
          .where(eq(trainingDays.id, d.id));
      }
    }).catch((err: { status?: number; message?: string }) => {
      if (err.status === 404) return c.json({ error: "Not found" }, 404);
      throw err;
    });

    return c.json({ success: true });
  },
);

// POST /:trainingId/days/reorder — bulk reorder day numbers
daysRouter.post(
  "/:trainingId/days/reorder",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId } = c.req.param();
    const { order } = await parseBody(c, ReorderDaysSchema);

    // Two-pass inside a tx: negative offsets first so we never collide with
    // (trainingId, dayNumber) unique constraint mid-update.
    await db.transaction(async (tx) => {
      for (const [i, { id }] of order.entries()) {
        await tx
          .update(trainingDays)
          .set({ dayNumber: -(i + 1), updatedAt: new Date() })
          .where(and(eq(trainingDays.id, id), eq(trainingDays.trainingId, trainingId)));
      }
      for (const { id, dayNumber } of order) {
        await tx
          .update(trainingDays)
          .set({ dayNumber, updatedAt: new Date() })
          .where(and(eq(trainingDays.id, id), eq(trainingDays.trainingId, trainingId)));
      }
    });

    return c.json({ success: true });
  },
);

// POST /:trainingId/days/:dayId/assign-module — assign an existing module to a day
daysRouter.post(
  "/:trainingId/days/:dayId/assign-module",
  requireTrainingPermission("edit_agenda"),
  async (c) => {
    const { trainingId, dayId } = c.req.param();
    const { moduleId } = await parseBody(c, AssignModuleToDaySchema);

    const [updated] = await db
      .update(trainingModules)
      .set({ dayId, updatedAt: new Date() })
      .where(and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)))
      .returning();

    if (!updated) return c.json({ error: "Module not found" }, 404);
    return c.json(updated);
  },
);
