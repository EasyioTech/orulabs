import { redis } from "../../db/redis";
import { logger } from "../../utils/logger";

/**
 * Recent-chat ring buffer in Redis. Live chat is otherwise fire-and-forget (not in the
 * DB), so a client that drops mid-session loses every message sent while it was gone. We
 * keep the last N messages per training in a capped Redis list with a 24h TTL, purely so
 * a reconnecting socket can replay what it missed — this is NOT a durable chat log.
 */
export interface BufferedChatMessage {
  id: string;
  userId: string;
  senderName: string;
  text: string;
  sentAt: string;
}

const CHAT_KEY = (trainingId: string) => `live:chat:${trainingId}`;
const CHAT_MAX = 100; // enough to repaint a reconnecting dock without unbounded growth
const CHAT_TTL = 60 * 60 * 24; // 24h — matches live-state TTL

export async function pushChatMessage(trainingId: string, msg: BufferedChatMessage): Promise<void> {
  const key = CHAT_KEY(trainingId);
  try {
    // RPUSH keeps chronological order; LTRIM caps the tail; EXPIRE refreshes the window.
    await redis
      .multi()
      .rPush(key, JSON.stringify(msg))
      .lTrim(key, -CHAT_MAX, -1)
      .expire(key, CHAT_TTL)
      .exec();
  } catch (err) {
    logger.error(err, "chat buffer push failed"); // non-fatal: live relay already happened
  }
}

export async function getRecentChat(trainingId: string): Promise<BufferedChatMessage[]> {
  try {
    const raw = await redis.lRange(CHAT_KEY(trainingId), 0, -1);
    return raw.map((r) => JSON.parse(r) as BufferedChatMessage);
  } catch (err) {
    logger.error(err, "chat buffer read failed");
    return [];
  }
}
