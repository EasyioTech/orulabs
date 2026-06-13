import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { trainingAnalytics } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { workspaceTenantMiddleware } from "../middleware/workspace";
import { requireTrainingPermission } from "../middleware/roleGuard";
import { getTrainingAnalytics } from "../services/analytics.service";
import { exportQueue } from "../jobs/exportAnalytics.job";

export const analyticsRouter = new Hono<AppEnv>();

analyticsRouter.use("*", authMiddleware);
analyticsRouter.use("*", workspaceTenantMiddleware);

analyticsRouter.get(
  "/:trainingId/analytics",
  requireTrainingPermission("view_data"),
  async (c) => {
    const { trainingId } = c.req.param();

    const saved = await db.query.trainingAnalytics.findFirst({
      where: eq(trainingAnalytics.trainingId, trainingId),
    });

    const agg = saved?.aggregateData as any;
    // Return stored snapshot's aggregateData only if it has the new dayId field
    if (agg && Object.keys(agg).length > 0 && (!agg.modules || agg.modules.length === 0 || agg.modules[0].dayId !== undefined)) {
      return c.json(agg);
    }

    const live = await getTrainingAnalytics(trainingId);
    return c.json(live);
  }
);

analyticsRouter.post(
  "/:trainingId/analytics/export",
  requireTrainingPermission("export_data"),
  async (c) => {
    const { trainingId } = c.req.param();
    const workspaceId = c.get("workspaceId") as string;

    const job = await exportQueue.add("export", { trainingId, workspaceId });

    return c.json({ jobId: job.id, status: "queued" }, 202);
  }
);

analyticsRouter.get(
  "/:trainingId/analytics/export/:jobId",
  requireTrainingPermission("view_data"),
  async (c) => {
    const { jobId } = c.req.param();
    const job = await exportQueue.getJob(jobId);

    if (!job) return c.json({ error: "Job not found" }, 404);

    const state = await job.getState();
    const result = job.returnvalue as { excelUrl?: string } | undefined;

    return c.json({ jobId, status: state, excelUrl: result?.excelUrl ?? null });
  }
);
