import { ChatSendSchema } from "@oruclass/validators";
import { getUserName } from "../caches/user-cache";
import type { ConnContext } from "../lib/context";

/**
 * Live chat relay. In-memory only — messages are not persisted. Kept as a raw listener
 * (not the validated `on` wrapper) to preserve prior behavior: malformed payloads are
 * silently dropped rather than answered with an error emit, and chat is not rate-limited.
 */
export function registerChatHandlers(ctx: ConnContext): void {
  const { io, socket, userId } = ctx;

  socket.on("chat:send", async (payload: unknown) => {
    const parsed = ChatSendSchema.safeParse(payload);
    if (!parsed.success) return; // silently drop malformed chat
    const { trainingId: tid, text } = parsed.data; // text is HTML-stripped by the schema transform

    // Verify sender is still a member of this training room.
    if (socket.data.trainingId !== tid) return;

    const senderName = await getUserName(userId);
    io.to(`training:${tid}`).emit("chat:message", {
      id: `${socket.id}-${Date.now()}`,
      userId,
      senderName,
      text,
      sentAt: new Date().toISOString(),
    });
  });
}
