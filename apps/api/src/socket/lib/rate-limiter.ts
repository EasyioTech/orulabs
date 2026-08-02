// Per-event rate limits: [maxRequests, windowMs]. Unlisted events are unlimited.
export const EVENT_LIMITS: Record<string, [number, number]> = {
  "participant:join": [5, 10_000],
  "module:unlock": [20, 1_000],
  "response:submit": [10, 1_000],
  "draw:update": [60, 1_000],
  "note:create": [10, 1_000],
  "note:position": [60, 1_000],
  "timer:sync": [10, 1_000],
};

/**
 * Fixed-window rate limiter, one instance per socket connection. Returns a predicate
 * that reports whether a given event is currently within its budget.
 */
export function makePerEventRateLimiter(): (event: string) => boolean {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return (event: string): boolean => {
    const limit = EVENT_LIMITS[event];
    if (!limit) return true;
    const [max, windowMs] = limit;
    const now = Date.now();
    const bucket = buckets.get(event);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(event, { count: 1, resetAt: now + windowMs });
      return true;
    }
    bucket.count++;
    return bucket.count <= max;
  };
}
