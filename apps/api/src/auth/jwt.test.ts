import { describe, it, expect } from "bun:test";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshTokenExpiryDate,
} from "./jwt";

describe("jwt auth tokens", () => {
  it("round-trips an access token preserving userId + email + flags", async () => {
    const token = await signAccessToken("user-1", "alice@example.com", true, false);
    const { userId, email, emailVerified, isAnonymous } = await verifyAccessToken(token);
    expect(userId).toBe("user-1");
    expect(email).toBe("alice@example.com");
    expect(emailVerified).toBe(true);
    expect(isAnonymous).toBe(false);
  });

  it("round-trips a refresh token preserving userId", async () => {
    const token = await signRefreshToken("user-2");
    const { userId } = await verifyRefreshToken(token);
    expect(userId).toBe("user-2");
  });

  it("rejects a tampered access token", async () => {
    const token = await signAccessToken("user-3", "bob@example.com", true, false);
    const tampered = token.slice(0, -3) + (token.endsWith("aaa") ? "bbb" : "aaa");
    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it("rejects a garbage token", async () => {
    await expect(verifyAccessToken("not.a.jwt")).rejects.toThrow();
  });

  it("issues a refresh expiry ~365 days out", () => {
    const ms = getRefreshTokenExpiryDate().getTime() - Date.now();
    const days = ms / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(364.9);
    expect(days).toBeLessThan(365.1);
  });
});
