"use client";

import { useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";

const QUEUE_KEY = (trainingId: string) => `oru:response_queue:${trainingId}`;

interface QueuedResponse {
  moduleId: string;
  responseData: unknown;
  queuedAt: number;
}

function loadQueue(trainingId: string): QueuedResponse[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY(trainingId)) ?? "[]");
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
  const queue = loadQueue(trainingId);
  const idx = queue.findIndex((q) => q.moduleId === moduleId);
  const entry: QueuedResponse = { moduleId, responseData, queuedAt: Date.now() };
  if (idx >= 0) queue[idx] = entry; else queue.push(entry);
  saveQueue(trainingId, queue);
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
