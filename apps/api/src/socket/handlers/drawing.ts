import type { StrokeData, StickyNote } from "@oruclass/types";
import { DrawUpdateSchema, DrawClearSchema, DrawRequestSchema, DrawSyncSchema, NoteCreateSchema, NotePositionSchema, TimerSyncSchema } from "@oruclass/validators";
import type { ConnContext } from "../lib/context";

/**
 * Whiteboard/notes/timer relays. These are pure fan-out: validate, then re-broadcast
 * to everyone else in the training room (socket.to excludes the sender). No DB, no
 * persistence — the canvas is reconstructed from peers via draw:sync on join.
 */
export function registerDrawingHandlers(ctx: ConnContext): void {
  const { userId, socket, on } = ctx;

  on("draw:update", DrawUpdateSchema, ({ trainingId, moduleId, stroke }) => {
    socket.to(`training:${trainingId}`).emit("draw:update", { moduleId, userId, stroke });
  });

  on("draw:clear", DrawClearSchema, ({ trainingId, moduleId }) => {
    socket.to(`training:${trainingId}`).emit("draw:clear", { moduleId, userId });
  });

  // Reconnect recovery: relay the request so peers (typically the trainer, who owns
  // the board) re-emit a draw:sync with the current canvas. No server state involved.
  on("draw:request", DrawRequestSchema, ({ trainingId, moduleId }) => {
    socket.to(`training:${trainingId}`).emit("draw:request", { moduleId, userId });
  });

  on("draw:sync", DrawSyncSchema, ({ trainingId, moduleId, strokes }) => {
    socket.to(`training:${trainingId}`).emit("draw:sync", {
      moduleId,
      userId,
      strokes: strokes as StrokeData[],
    });
  });

  on("note:create", NoteCreateSchema, ({ trainingId, moduleId, note }) => {
    socket.to(`training:${trainingId}`).emit("note:create", { moduleId, note: note as StickyNote });
  });

  on("note:position", NotePositionSchema, ({ trainingId, moduleId, noteId, x, y }) => {
    socket.to(`training:${trainingId}`).emit("note:position", { moduleId, noteId, x, y });
  });

  on("timer:sync", TimerSyncSchema, ({ trainingId, moduleId, remaining, running, duration }) => {
    socket.to(`training:${trainingId}`).emit("timer:sync", { moduleId, remaining, running, duration });
  });
}
