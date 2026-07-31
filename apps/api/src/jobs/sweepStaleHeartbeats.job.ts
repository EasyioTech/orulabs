import { Worker, Queue } from "bullmq";
import { lt, and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { trainingParticipants } from "../db/schema";
import { tryGetIO } from "../socket/io-instance";
import { logger } from "../utils/logger";

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const connection = { host: new URL(REDIS_URL).hostname, port: Number(new URL(REDIS_URL).port || 6379) };

// Participants whose lastHeartbeat is older than this are considered offline.
// Must be > HEARTBEAT_WRITE_MS (15s) + socket pingTimeout (20s) to avoid false positives.
const STALE_THRESHOLD_MS = 60_000;
const SWEEP_INTERVAL_MS = 30_000;

const sweepQueue = new Queue("heartbeat-sweep", { connection });

export function startHeartbeatSweepWorker() {
  const worker = new Worker(
    "heartbeat-sweep",
    async () => {
      const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
      const stale = await db
        .update(trainingParticipants)
        .set({ connectionStatus: "offline" })
        .where(
          and(
            eq(trainingParticipants.connectionStatus, "online"),
            lt(trainingParticipants.lastHeartbeat, cutoff),
          ),
        )
        .returning({ userId: trainingParticipants.userId, trainingId: trainingParticipants.trainingId });

      if (stale.length === 0) return;

      logger.debug({ count: stale.length }, "heartbeat sweep: marked offline");

      const io = tryGetIO();
      if (!io) return;

      for (const { userId, trainingId } of stale) {
        io.to(`training:${trainingId}`).emit("participant:left", { userId });
      }
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    logger.error(err, `heartbeat-sweep job ${job?.id} failed`);
  });

  // Schedule a repeating job — kicks off the first run immediately and repeats every SWEEP_INTERVAL_MS.
  sweepQueue.upsertJobScheduler(
    "heartbeat-sweep-repeating",
    { every: SWEEP_INTERVAL_MS },
    { name: "heartbeat-sweep" },
  );

  return worker;
}
