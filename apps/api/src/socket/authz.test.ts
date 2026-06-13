import { describe, it, expect } from "bun:test";
import { signAccessToken, verifyAccessToken } from "../auth/jwt";
import {
  DrawUpdateSchema,
  NotePositionSchema,
  TimerSyncSchema,
  ModuleUnlockSchema,
  StopwatchActionSchema,
} from "@oruclass/validators";

const UUID = "00000000-0000-4000-8000-000000000000";

// Mirrors the socket handshake guard in index.ts: a connection is admitted only when
// its handshake token verifies. These tests pin that authz contract.
describe("socket handshake authz", () => {
  it("admits a connection carrying a valid access token", async () => {
    const token = await signAccessToken("trainer-1", "t@example.com", true, false);
    const { userId } = await verifyAccessToken(token);
    expect(userId).toBe("trainer-1");
  });

  it("rejects a missing/empty token", async () => {
    await expect(verifyAccessToken("")).rejects.toThrow();
  });

  it("rejects a forged token", async () => {
    await expect(verifyAccessToken("ey.forged.token")).rejects.toThrow();
  });
});

// The relay handlers safeParse every client payload before broadcasting. These pin the
// accept/reject boundary so a malformed payload can never reach the room.
describe("socket payload validation", () => {
  it("accepts a well-formed draw:update payload", () => {
    const ok = DrawUpdateSchema.safeParse({
      trainingId: UUID,
      moduleId: UUID,
      stroke: { id: "s1", color: "#000", width: 2, points: [{ x: 1, y: 2 }] },
    });
    expect(ok.success).toBe(true);
  });

  it("rejects a draw:update with a non-uuid trainingId", () => {
    const bad = DrawUpdateSchema.safeParse({
      trainingId: "nope",
      moduleId: UUID,
      stroke: { id: "s1", color: "#000", width: 2, points: [{ x: 1, y: 2 }] },
    });
    expect(bad.success).toBe(false);
  });

  it("rejects note:position coordinates out of bounds", () => {
    const bad = NotePositionSchema.safeParse({
      trainingId: UUID,
      moduleId: UUID,
      noteId: "n1",
      x: 1e9,
      y: 0,
    });
    expect(bad.success).toBe(false);
  });

  it("accepts a valid timer:sync payload", () => {
    const ok = TimerSyncSchema.safeParse({
      trainingId: UUID,
      moduleId: UUID,
      remaining: 30,
      running: true,
      duration: 60,
    });
    expect(ok.success).toBe(true);
  });

  it("rejects module:unlock missing moduleId", () => {
    const bad = ModuleUnlockSchema.safeParse({ trainingId: UUID });
    expect(bad.success).toBe(false);
  });

  it("rejects stopwatch action outside the allowed enum", () => {
    const bad = StopwatchActionSchema.safeParse({
      trainingId: UUID,
      moduleId: UUID,
      action: "explode",
    });
    expect(bad.success).toBe(false);
  });
});
