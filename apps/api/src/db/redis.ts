import { createClient } from "redis";
import { logger } from "../utils/logger";

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

export const redis = createClient({ url: REDIS_URL });

// Dedicated clients for the Socket.IO Redis adapter. A subscriber connection cannot
// issue normal commands, so the adapter needs its own pub/sub pair separate from the
// shared `redis` client used for app data.
export const pubClient = redis.duplicate();
export const subClient = redis.duplicate();

redis.on("error", (err) => logger.error(err, "Redis client error"));
pubClient.on("error", (err) => logger.error(err, "Redis pub client error"));
subClient.on("error", (err) => logger.error(err, "Redis sub client error"));

export async function connectRedis() {
  await Promise.all([
    redis.isOpen ? Promise.resolve() : redis.connect(),
    pubClient.isOpen ? Promise.resolve() : pubClient.connect(),
    subClient.isOpen ? Promise.resolve() : subClient.connect(),
  ]);
}
