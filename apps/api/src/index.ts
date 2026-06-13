import "./instrument";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@oruclass/types";
import { authRouter } from "./routes/auth";
import { workspacesRouter } from "./routes/workspaces";
import { trainingsRouter } from "./routes/trainings";
import { modulesRouter } from "./routes/modules";
import { daysRouter } from "./routes/days";
import { participantsRouter } from "./routes/participants";
import { responsesRouter } from "./routes/responses";
import { analyticsRouter } from "./routes/analytics";
import { invitationsRouter } from "./routes/invitations";
import { sessionsRouter } from "./routes/sessions";
import { facilitatorInvitationsRouter } from "./routes/facilitatorInvitations";
import { errorHandler } from "./middleware/errorHandler";
import { authRateLimiter, guestRateLimiter, apiRateLimiter } from "./middleware/rateLimiter";
import { registerSocketHandlers } from "./socket/handlers";
import { setIO } from "./socket/io-instance";
import { startExportWorker } from "./jobs/exportAnalytics.job";
import { startDigestWorker } from "./jobs/sendSessionDigest.job";
import { connectRedis, pubClient, subClient, redis } from "./db/redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { logger } from "./utils/logger";
import { db } from "./db/client";
import { sql } from "drizzle-orm";
import type { AppEnv } from "./types/hono";

const PORT = Number(process.env.PORT ?? 3001);
const ALLOWED_ORIGIN = process.env.WEB_URL ?? "http://localhost:3000";
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES ?? 10 * 1024 * 1024); // 10MB

// ─── Hono App ─────────────────────────────────────────────────────────────────
const app = new Hono<AppEnv>();

app.use("*", honoLogger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin || process.env.NODE_ENV !== "production") return origin || "http://localhost:3000";
      const allowedOrigins = [
        "https://orulabs.in",
        "https://www.orulabs.in"
      ];
      if (allowedOrigins.includes(origin)) return origin;
      return ALLOWED_ORIGIN;
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Workspace-ID"],
    // Required so the browser sends/receives the httpOnly refresh-token cookie.
    credentials: true,
  }),
);

app.get("/health", async (c) => {
  const ts = Date.now();
  const checks: Record<string, "ok" | "error"> = {};
  try {
    await db.execute(sql`SELECT 1`);
    checks.db = "ok";
  } catch { checks.db = "error"; }
  try {
    await redis.ping();
    checks.redis = "ok";
  } catch { checks.redis = "error"; }
  const allOk = Object.values(checks).every((v) => v === "ok");
  return c.json({ status: allOk ? "ok" : "degraded", checks, ts }, allOk ? 200 : 503);
});

// Lenient guest limiter must be mounted BEFORE the strict auth wildcard so a whole
// room can provision anonymous guests at once (auth limiter skips this path).
app.use("/api/auth/guest", guestRateLimiter);
app.use("/api/auth/*", authRateLimiter);
app.use("/api/*", apiRateLimiter);

app.route("/api/auth", authRouter);
app.route("/api/workspaces", workspacesRouter);

trainingsRouter.route("/", modulesRouter);
trainingsRouter.route("/", daysRouter);
trainingsRouter.route("/", responsesRouter);
trainingsRouter.route("/", analyticsRouter);
trainingsRouter.route("/", sessionsRouter);
app.route("/api/workspaces/:workspaceId/trainings", trainingsRouter);

app.route("/api/invitations", facilitatorInvitationsRouter);
app.route("/api", participantsRouter);
app.route("/api/workspaces/:workspaceId", invitationsRouter);

app.onError(errorHandler);

// ─── HTTP Server + Socket.IO ──────────────────────────────────────────────────
const httpServer = createServer(async (req, res) => {
  try {
    let tooLarge = false;
    const bodyBuffer = await new Promise<Buffer | undefined>((resolve, reject) => {
      if (req.method === "GET" || req.method === "HEAD") {
        return resolve(undefined);
      }
      const chunks: Buffer[] = [];
      let received = 0;
      req.on("data", (chunk: Buffer) => {
        received += chunk.length;
        // Guard against unbounded in-memory buffering of request bodies.
        if (received > MAX_BODY_BYTES) {
          tooLarge = true;
          req.destroy();
          return resolve(undefined);
        }
        chunks.push(chunk);
      });
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });

    if (tooLarge) {
      if (!res.headersSent) res.writeHead(413, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Payload too large" }));
    }

    const response = await app.fetch(
      new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers: req.headers as unknown as Record<string, string>,
        body: bodyBuffer,
      })
    );

    res.writeHead(response.status, Object.fromEntries(response.headers));
    
    if (response.body) {
      response.body.pipeTo(
        new WritableStream({
          write(chunk) {
            res.write(chunk);
          },
          close() {
            res.end();
          },
        })
      ).catch((err) => {
        logger.error(err, "Stream pipe error");
        res.end();
      });
    } else {
      res.end();
    }
  } catch (err) {
    logger.error(err, "Server request error");
    if (!res.headersSent) res.writeHead(500);
    res.end("Internal Server Error");
  }
});

export const io = new SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || process.env.NODE_ENV !== "production") return callback(null, true);
      const allowedOrigins = [
        "https://orulabs.in",
        "https://www.orulabs.in"
      ];
      if (allowedOrigins.includes(origin)) return callback(null, origin);
      callback(null, ALLOWED_ORIGIN);
    },
  },
  pingTimeout: 20000,
  pingInterval: 25000,
});
setIO(io);

// Verify JWT at socket handshake
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));

    const { verifyAccessToken } = await import("./auth/jwt");
    const { userId, email } = await verifyAccessToken(token);
    socket.data.userId = userId;
    socket.data.userEmail = email;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

registerSocketHandlers(io);

startExportWorker();
startDigestWorker();

// Connect Redis (app data + adapter pub/sub) before accepting traffic so the Socket.IO
// Redis adapter can fan-out events across instances. If Redis is unreachable we still
// boot single-instance rather than crash — a solo node needs no cross-node fan-out.
await connectRedis()
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Socket.IO Redis adapter attached");
  })
  .catch((err) => logger.error(err, "Redis connect failed — running single-instance (no adapter)"));

httpServer.listen(PORT, "0.0.0.0", () => {
  logger.info(`API server running on http://0.0.0.0:${PORT}`);
  logger.info(`Socket.IO listening on ws://0.0.0.0:${PORT}`);
  if (process.env.NODE_ENV !== "production" && process.env.SKIP_EMAIL_VERIFICATION === "true") {
    logger.warn("⚠ EMAIL VERIFICATION SKIPPED (dev) — signups are auto-verified");
  }
});

export { app };
