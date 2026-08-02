import type { StrokeData, StickyNote } from "@oruclass/types";
import { DrawUpdateSchema, DrawClearSchema, DrawSyncSchema, NoteCreateSchema, NotePositionSchema, TimerSyncSchema } from "@oruclass/validators";
import { SocketError } from "../lib/context";
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

  on("draw:sync", DrawSyncSchema, ({ trainingId, moduleId, strokes, snapshot }) => {
    if (!strokes && !snapshot) throw new SocketError("BAD_PAYLOAD", "draw:sync requires strokes or snapshot");
    socket.to(`training:${trainingId}`).emit("draw:sync", {
      moduleId,
      userId,
      strokes: strokes as StrokeData[] | undefined,
      snapshot: snapshot as Record<string, unknown> | undefined,
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
