"use client";

import { useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";

const QUEUE_KEY = (trainingId: string) => `oru:response_queue:${trainingId}`;

// Bound the offline queue so a long disconnection can't grow localStorage without
// limit or replay hours-stale answers into a session that has since moved on.
// TTL: a queued answer older than this is dropped rather than flushed on reconnect.
const QUEUE_TTL_MS = 6 * 60 * 60 * 1000; // 6h — comfortably longer than any single session
const QUEUE_MAX = 50; // oldest entries evicted past this; dedup-by-module keeps it small anyway

interface QueuedResponse {
  moduleId: string;
  responseData: unknown;
  queuedAt: number;
}

// Drop entries older than the TTL. Returns the pruned list plus whether anything
// changed, so callers can persist the compaction without a redundant write.
function pruneQueue(queue: QueuedResponse[]): { queue: QueuedResponse[]; changed: boolean } {
  const cutoff = Date.now() - QUEUE_TTL_MS;
  const fresh = queue.filter((q) => typeof q.queuedAt === "number" && q.queuedAt >= cutoff);
  return { queue: fresh, changed: fresh.length !== queue.length };
}

function loadQueue(trainingId: string): QueuedResponse[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(QUEUE_KEY(trainingId)) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const { queue, changed } = pruneQueue(parsed as QueuedResponse[]);
    if (changed) saveQueue(trainingId, queue); // compact expired entries on read
    return queue;
  } catch {
    return [];
  }
}

function saveQueue(trainingId: string, queue: QueuedResponse[]) {
  try {
    localStorage.setItem(QUEUE_KEY(trainingId), JSON.stringify(queue));
  } catch {}
}

function queueResponse(trainingId: string, moduleId: string, responseData: unknown) {
  const queue = loadQueue(trainingId); // already TTL-pruned
  const idx = queue.findIndex((q) => q.moduleId === moduleId);
  const entry: QueuedResponse = { moduleId, responseData, queuedAt: Date.now() };
  if (idx >= 0) queue[idx] = entry; else queue.push(entry);
  // Hard cap as a safety net (dedup-by-module usually keeps this well under the
  // limit); evict the oldest entries first so the most recent answers survive.
  const bounded = queue.length > QUEUE_MAX ? queue.slice(queue.length - QUEUE_MAX) : queue;
  saveQueue(trainingId, bounded);
}

/**
 * Submits a response via socket with ack + localStorage offline queue.
 * Returns { submit, isOffline } — submit resolves when server acks.
 */
export function useResponseSubmit(trainingId: string) {
  const socket = useSocket();

  const submit = useCallback(
    (moduleId: string, responseData: unknown): Promise<void> => {
      return new Promise((resolve) => {
        if (!socket?.connected) {
          queueResponse(trainingId, moduleId, responseData);
          resolve(); // resolve so UI can proceed (optimistic)
          return;
        }

        // 5s timeout: if server never acks (network stall, crash) fall back to queue
        // instead of leaving the promise permanently unresolved.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socket.timeout(5000) as any).emit(
          "response:submit",
          { trainingId, moduleId, responseData: responseData as Record<string, unknown> },
          (err: Error | null, result?: { ok: boolean; error?: string }) => {
            if (err || !result?.ok) {
              queueResponse(trainingId, moduleId, responseData);
            }
            resolve();
          },
        );
      });
    },
    [socket, trainingId],
  );

  return { submit };
}

export { QUEUE_KEY, loadQueue, saveQueue };
