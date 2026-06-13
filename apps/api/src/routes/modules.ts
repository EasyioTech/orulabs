import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { eq, and, asc, isNull } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "../db/client";
import { trainingModules, trainings, participantResponses } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { requireTrainingPermission } from "../middleware/roleGuard";
import { getOrCreateState, persistState } from "../socket/state";
import { getIO } from "../socket/io-instance";
import {
  CreateModuleSchema,
  UpdateModuleSchema,
  ReorderModulesSchema,
  DuplicateModuleSchema,
} from "@oruclass/validators";
import { desc } from "drizzle-orm";
import { parseBody } from "../utils/validators";

type TrainingModule = InferSelectModel<typeof trainingModules>;

export const modulesRouter = new Hono<AppEnv>();

modulesRouter.use("*", authMiddleware);
modulesRouter.use("*", workspaceTenantMiddleware);

// Parse "?limit=&offset=" with hard caps so a client cannot ask for unbounded
// rows. Cap is per-endpoint conservative; tune if real data demands it.
function parsePagination(c: { req: { query: (k: string) => string | undefined } }, maxLimit: number) {
  const rawLimit = Number(c.req.query("limit") ?? maxLimit);
  const rawOffset = Number(c.req.query("offset") ?? 0);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(1, Math.trunc(rawLimit)), maxLimit) : maxLimit;
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.trunc(rawOffset)) : 0;
  return { limit, offset };
}

// GET /trainings/:trainingId/modules — paginated
modulesRouter.get("/:trainingId/modules", async (c) => {
  const { trainingId } = c.req.param();
  const { limit, offset } = parsePagination(c, 200);

  const modules = await db.query.trainingModules.findMany({
    where: eq(trainingModules.trainingId, trainingId),
    orderBy: [asc(trainingModules.position)],
    limit,
    offset,
  });

  return c.json({ data: modules, limit, offset });
});

// POST /trainings/:trainingId/modules
modulesRouter.post(
  "/:trainingId/modules",
  requireTrainingPermission("edit_modules"),
  async (c) => {
    const { trainingId } = c.req.param();
    const body = await parseBody(c, CreateModuleSchema);

    const [module] = await db
      .insert(trainingModules)
      .values({ trainingId, ...body })
      .returning();

    return c.json(module, 201);
  },
);

// PATCH /trainings/:trainingId/modules/:moduleId
modulesRouter.patch(
  "/:trainingId/modules/:moduleId",
  requireTrainingPermission("edit_modules"),
  async (c) => {
    const { trainingId, moduleId } = c.req.param();
    const body = await parseBody(c, UpdateModuleSchema);

    const [updated] = await db
      .update(trainingModules)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)))
      .returning();

    if (!updated) return c.json({ error: "Not found" }, 404);
    return c.json(updated);
  },
);

// GET /trainings/:trainingId/modules/:moduleId/responses — paginated
modulesRouter.get(
  "/:trainingId/modules/:moduleId/responses",
  requireTrainingPermission("view_data"),
  async (c) => {
    const { trainingId, moduleId } = c.req.param();
    const { limit, offset } = parsePagination(c, 500);

    const responses = await db.query.participantResponses.findMany({
      where: and(
        eq(participantResponses.trainingId, trainingId),
        eq(participantResponses.moduleId, moduleId),
      ),
      with: {
        user: { columns: { id: true, name: true, email: true } },
      },
      orderBy: [asc(participantResponses.submittedAt)],
      limit,
      offset,
    });

    return c.json({ data: responses, limit, offset });
  },
);

// DELETE /trainings/:trainingId/modules/:moduleId
modulesRouter.delete(
  "/:trainingId/modules/:moduleId",
  requireTrainingPermission("edit_modules"),
  async (c) => {
    const { trainingId, moduleId } = c.req.param();

    // Atomic delete + dangling-ref cleanup so we can't leave currentActiveModuleId
    // pointing to a deleted row if the second statement fails.
    const result = await db.transaction(async (tx) => {
      const deleted = await tx
        .delete(trainingModules)
        .where(and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)))
        .returning({ id: trainingModules.id });

      if (deleted.length === 0) return { deleted: false, clearedActive: false };

      const cleared = await tx
        .update(trainings)
        .set({ currentActiveModuleId: null, updatedAt: new Date() })
        .where(and(eq(trainings.id, trainingId), eq(trainings.currentActiveModuleId, moduleId)))
        .returning({ id: trainings.id });

      return { deleted: true, clearedActive: cleared.length > 0 };
    });

    if (!result.deleted) return c.json({ error: "Not found" }, 404);

    if (result.clearedActive) {
      const state = getOrCreateState(trainingId);
      state.activeModuleId = null;
      await persistState(trainingId);
      getIO().to(`training:${trainingId}`).emit("module:unlocked", { moduleId: null, module: null });
    }

    return c.json({ success: true });
  },
);

// POST /trainings/:trainingId/modules/:moduleId/unlock
modulesRouter.post(
  "/:trainingId/modules/:moduleId/unlock",
  requireTrainingPermission("unlock_modules"),
  async (c) => {
    const { trainingId, moduleId } = c.req.param();

    // Ownership check + unlock + currentActiveModuleId set must be atomic so
    // a missing module never half-applies (e.g., training updated to point at
    // a row that doesn't exist).
    const result = await db.transaction(async (tx) => {
      const moduleRow = await tx.query.trainingModules.findFirst({
        where: and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)),
      });
      if (!moduleRow) return { ok: false as const };

      const [unlocked] = await tx
        .update(trainingModules)
        .set({ isUnlocked: true, updatedAt: new Date() })
        .where(and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)))
        .returning();

      await tx
        .update(trainings)
        .set({ currentActiveModuleId: moduleId, updatedAt: new Date() })
        .where(eq(trainings.id, trainingId));

      return { ok: true as const, module: unlocked };
    });

    if (!result.ok) return c.json({ error: "Module not found in training" }, 404);

    const state = getOrCreateState(trainingId);
    state.activeModuleId = moduleId;
    await persistState(trainingId);

    getIO().to(`training:${trainingId}`).emit("module:unlocked", {
      moduleId,
      module: result.module satisfies TrainingModule,
    });

    return c.json({ success: true, moduleId, module: result.module });
  },
);

// POST /trainings/:trainingId/modules/:moduleId/duplicate
// Copies module into the same or another training/day. Target training must
// belong to the same workspace.
modulesRouter.post(
  "/:trainingId/modules/:moduleId/duplicate",
  requireTrainingPermission("edit_modules"),
  async (c) => {
    const workspaceId = c.get("workspaceId") as string;
    const { trainingId, moduleId } = c.req.param();
    const body = await parseBody(c, DuplicateModuleSchema);
    const targetTrainingId = body.targetTrainingId ?? trainingId;
    const targetDayId = body.targetDayId ?? null;

    const created = await db.transaction(async (tx) => {
      const src = await tx.query.trainingModules.findFirst({
        where: and(eq(trainingModules.id, moduleId), eq(trainingModules.trainingId, trainingId)),
      });
      if (!src) return { ok: false as const, code: 404, msg: "Source module not found" };

      // Verify target training is in same workspace
      const target = await tx.query.trainings.findFirst({
        where: and(eq(trainings.id, targetTrainingId), eq(trainings.workspaceId, workspaceId), isNull(trainings.deletedAt)),
      });
      if (!target) return { ok: false as const, code: 404, msg: "Target training not found" };

      // New position = end of target list
      const last = await tx.query.trainingModules.findFirst({
        where: eq(trainingModules.trainingId, targetTrainingId),
        orderBy: [desc(trainingModules.position)],
      });
      const nextPosition = (last?.position ?? -1) + 1;

      const [row] = await tx
        .insert(trainingModules)
        .values({
          trainingId: targetTrainingId,
          dayId: targetDayId,
          title: src.title,
          moduleType: src.moduleType,
          position: nextPosition,
          isAlwaysOn: src.isAlwaysOn,
          config: src.config,
        })
        .returning();
      return { ok: true as const, row };
    });

    if (!created.ok) return c.json({ error: created.msg }, created.code as 404);
    return c.json(created.row, 201);
  },
);

// POST /trainings/:trainingId/modules/reorder — bulk reorder positions.
// Two-pass negative-then-positive inside a tx so we never collide with any
// unique (trainingId, position) constraint mid-update.
modulesRouter.post(
  "/:trainingId/modules/reorder",
  requireTrainingPermission("edit_modules"),
  async (c) => {
    const { trainingId } = c.req.param();
    const { order } = await parseBody(c, ReorderModulesSchema);

    await db.transaction(async (tx) => {
      for (const [i, { id }] of order.entries()) {
        await tx
          .update(trainingModules)
          .set({ position: -(i + 1), updatedAt: new Date() })
          .where(and(eq(trainingModules.id, id), eq(trainingModules.trainingId, trainingId)));
      }
      for (const { id, position } of order) {
        await tx
          .update(trainingModules)
          .set({ position, updatedAt: new Date() })
          .where(and(eq(trainingModules.id, id), eq(trainingModules.trainingId, trainingId)));
      }
    });

    return c.json({ success: true });
  },
);
