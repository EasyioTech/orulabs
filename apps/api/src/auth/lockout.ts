import { redis } from "../db/redis";

const MAX_ATTEMPTS = 10;
const LOCKOUT_TTL = 15 * 60; // 15 minutes in seconds
const WINDOW_TTL = 15 * 60;

function key(email: string) {
  return `lockout:${email.toLowerCase()}`;
}

export async function recordFailedLogin(email: string): Promise<void> {
  const k = key(email);
  const count = await redis.incr(k);
  if (count === 1) {
    await redis.expire(k, WINDOW_TTL);
  }
}

export async function isLockedOut(email: string): Promise<boolean> {
  const count = await redis.get(key(email));
  return count !== null && parseInt(count, 10) >= MAX_ATTEMPTS;
}

export async function clearLockout(email: string): Promise<void> {
  await redis.del(key(email));
}

export function lockoutTTL() {
  return LOCKOUT_TTL;
}
