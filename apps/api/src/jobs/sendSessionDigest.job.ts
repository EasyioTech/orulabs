import { Worker, Queue } from "bullmq";
import { sendSessionDigestEmail } from "../services/email.service";

const connection = { host: process.env.REDIS_HOST ?? "127.0.0.1", port: 6379 };

export const digestQueue = new Queue("session-digest", { connection });

export function startDigestWorker() {
  const worker = new Worker(
    "session-digest",
    async (job) => {
      const { to, trainingTitle, participantCount, moduleCount, completedAt, analyticsUrl } =
        job.data as {
          to: string;
          trainingTitle: string;
          participantCount: number;
          moduleCount: number;
          completedAt: string;
          analyticsUrl: string;
        };

      await sendSessionDigestEmail({ to, trainingTitle, participantCount, moduleCount, completedAt, analyticsUrl });
    },
    { connection }
  );

  worker.on("failed", (job, err) => {
    console.error(`Digest job ${job?.id} failed:`, err.message);
  });

  return worker;
}
