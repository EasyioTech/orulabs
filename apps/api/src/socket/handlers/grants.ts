import { hasPermission } from "@oruclass/utils";
import { grantPermission, revokePermission } from "../state";
import { getUserName } from "../caches/user-cache";
import type { ConnContext } from "../lib/context";

type GrantPayload = { trainingId?: string; targetUserId?: string; permission?: string };
type Ack = (r: { ok: boolean; error?: string }) => void;

const VALID_PERMISSIONS = ["unlock_modules", "pause_room"] as const;
type ValidPermission = (typeof VALID_PERMISSIONS)[number];

/**
 * Session permission delegation. Raw ack-based listeners (not the `on` wrapper): they
 * validate ad-hoc, answer exclusively via the ack callback, and target only the sockets
 * belonging to the affected user rather than broadcasting to the room.
 */
export function registerGrantHandlers(ctx: ConnContext): void {
  const { io, socket, userId } = ctx;

  socket.on("session:grant_permission", async (data: unknown, ack?: Ack) => {
    const { trainingId, targetUserId, permission } = (data ?? {}) as GrantPayload;
    if (!trainingId || !targetUserId || !permission) { ack?.({ ok: false, error: "Bad payload" }); return; }
    if (!socket.data.trainingRole || !hasPermission(socket.data.trainingRole, "assign_roles")) {
      ack?.({ ok: false, error: "Insufficient permissions" }); return;
    }
    if (!VALID_PERMISSIONS.includes(permission as ValidPermission)) {
      ack?.({ ok: false, error: "Invalid permission" }); return;
    }
    grantPermission(trainingId, targetUserId, permission as ValidPermission);
    const senderName = await getUserName(userId);
    // Emit to every socket that belongs to targetUserId in this training.
    const sockets = await io.in(`training:${trainingId}`).fetchSockets();
    for (const s of sockets) {
      if (s.data.userId === targetUserId) {
        s.emit("session:permission_granted", { permission: permission as ValidPermission, grantedBy: senderName });
      }
    }
    ack?.({ ok: true });
  });

  socket.on("session:revoke_permission", async (data: unknown, ack?: Ack) => {
    const { trainingId, targetUserId, permission } = (data ?? {}) as GrantPayload;
    if (!trainingId || !targetUserId || !permission) { ack?.({ ok: false, error: "Bad payload" }); return; }
    if (!socket.data.trainingRole || !hasPermission(socket.data.trainingRole, "assign_roles")) {
      ack?.({ ok: false, error: "Insufficient permissions" }); return;
    }
    revokePermission(trainingId, targetUserId, permission as ValidPermission);
    const sockets = await io.in(`training:${trainingId}`).fetchSockets();
    for (const s of sockets) {
      if (s.data.userId === targetUserId) {
        s.emit("session:permission_revoked", { permission: permission as ValidPermission });
      }
    }
    ack?.({ ok: true });
  });
}
