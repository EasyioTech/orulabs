import { logger } from "../utils/logger";
import { createConnContext } from "./lib/context";
import type { IO, AppSocket } from "./lib/context";
import { registerParticipantHandlers } from "./handlers/participants";
import { registerModuleHandlers } from "./handlers/modules";
import { registerStopwatchHandlers } from "./handlers/stopwatch";
import { registerResponseHandlers } from "./handlers/responses";
import { registerDrawingHandlers } from "./handlers/drawing";
import { registerChatHandlers } from "./handlers/chat";
import { registerGrantHandlers } from "./handlers/grants";

// Re-exported for callers that bust the cache on session lifecycle events
// (trainings routes import it from this path).
export { bustLiveSessionCache } from "./caches/live-session-cache";

/**
 * Wires every real-time listener for a connection. The God Object that used to hold all
 * of this now delegates to domain handlers, each built on a shared per-connection
 * context (createConnContext) that centralizes rate-limiting, Zod validation, and error
 * emission. Services own all DB access; handlers only orchestrate + broadcast.
 */
export function registerSocketHandlers(io: IO): void {
  io.on("connection", (socket: AppSocket) => {
    // userId is set by JWT handshake middleware in index.ts — never trust client payload.
    const userId = socket.data.userId;
    if (!userId) {
      socket.emit("error", { code: "UNAUTHORIZED", message: "missing auth" });
      socket.disconnect(true);
      return;
    }
    logger.debug({ socketId: socket.id, userId }, "socket connected");

    const ctx = createConnContext(io, socket, userId);

    registerParticipantHandlers(ctx);
    registerModuleHandlers(ctx);
    registerStopwatchHandlers(ctx);
    registerResponseHandlers(ctx);
    registerDrawingHandlers(ctx);
    registerChatHandlers(ctx);
    registerGrantHandlers(ctx);
  });
}
