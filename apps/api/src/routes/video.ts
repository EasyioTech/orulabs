import { Hono } from "hono";
import { AccessToken } from "livekit-server-sdk";
import type { AppEnv } from "../types/hono";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db/client";
import { trainingFacilitators } from "../db/schema";
import { and, eq } from "drizzle-orm";

export const videoRouter = new Hono<AppEnv>();

videoRouter.post("/token", authMiddleware, async (c) => {
  const { trainingId } = await c.req.json();
  const userId = c.get("userId");
  const userEmail = c.get("userEmail");

  if (!trainingId) {
    return c.json({ error: "Missing trainingId" }, 400);
  }

  // Check if user is a trainer
  const facilitator = await db.query.trainingFacilitators.findFirst({
    where: and(eq(trainingFacilitators.trainingId, trainingId), eq(trainingFacilitators.userId, userId)),
  });

  const isTrainer = !!facilitator;

  const roomName = `training-${trainingId}`;
  const participantName = userEmail.split("@")[0];

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY || "devkey",
    process.env.LIVEKIT_API_SECRET || "secret",
    {
      identity: userId,
      name: participantName,
    }
  );

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true, 
    canSubscribe: true,
  });

  return c.json({ token: await at.toJwt() });
});
