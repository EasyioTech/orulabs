import type { Server as SocketIOServer, Socket } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@oruclass/types";
import type { z } from "zod";
import { logger } from "../../utils/logger";
import { makePerEventRateLimiter } from "./rate-limiter";

export type IO = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export type Ack = (result: { ok: boolean; error?: string }) => void;

/**
 * Domain error a service can throw to surface a specific client-facing code/message
 * (e.g. FORBIDDEN, SESSION_NOT_OPEN). The `on()` wrapper translates it into a
 * `socket.emit("error", …)` and/or an ack rejection. Anything that is NOT a
 * SocketError is treated as an unexpected fault: logged, then reported generically.
 */
export class SocketError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "SocketError";
  }
}

interface OnOpts {
  /** Rate-limit bucket key; defaults to the event name. */
  limitKey?: string;
  /** Log label + ack message used when the handler throws a non-SocketError. */
  internalMessage?: string;
  /**
   * Whether to also `socket.emit("error", …)` on an unexpected throw. Defaults to
   * true. Set false for ack-only events (e.g. response:submit) that must not push a
   * generic error toast to the client.
   */
  emitInternalError?: boolean;
}

/**
 * Registers a validated, rate-limited event listener. Collapses the four pieces of
 * boilerplate that were previously repeated in every handler — rate-limit check,
 * Zod safeParse + BAD_PAYLOAD emit, try/catch, and error emit — into one place.
 *
 * The handler receives already-parsed, typed data and the optional ack. It only ever
 * contains business logic; failure signalling is done by throwing SocketError.
 */
export type RegisterFn = <Schema extends z.ZodTypeAny>(
  event: keyof ClientToServerEvents & string,
  schema: Schema,
  handler: (data: z.infer<Schema>, ack?: Ack) => void | Promise<void>,
  opts?: OnOpts,
) => void;

export interface ConnContext {
  io: IO;
  socket: AppSocket;
  /** Verified user id from the JWT handshake — never from a client payload. */
  userId: string;
  /** Register a validated + rate-limited handler. */
  on: RegisterFn;
}

function emitError(socket: AppSocket, code: string, message: string): void {
  socket.emit("error", { code, message });
}

function ackFail(ack: Ack | undefined, error: string): void {
  if (typeof ack === "function") ack({ ok: false, error });
}

/**
 * Builds the per-connection context. The rate limiter is created once per socket so
 * buckets are naturally scoped to the connection, exactly as before.
 */
export function createConnContext(io: IO, socket: AppSocket, userId: string): ConnContext {
  const isAllowed = makePerEventRateLimiter();

  const on: RegisterFn = (event, schema, handler, opts) => {
    // The listener takes untyped wire args; parsing narrows them. socket.on's typed
    // overloads don't fit an unknown-payload signature, so cast at the boundary only.
    const listener = async (payload: unknown, ack?: Ack): Promise<void> => {
      if (!isAllowed(opts?.limitKey ?? event)) {
        emitError(socket, "RATE_LIMIT", "rate limit exceeded");
        ackFail(ack, "rate limit exceeded");
        return;
      }
      const parsed = schema.safeParse(payload);
      if (!parsed.success) {
        emitError(socket, "BAD_PAYLOAD", `invalid ${event} payload`);
        ackFail(ack, "Invalid payload");
        return;
      }
      try {
        await handler(parsed.data, ack);
      } catch (err) {
        if (err instanceof SocketError) {
          emitError(socket, err.code, err.message);
          ackFail(ack, err.message);
          return;
        }
        const message = opts?.internalMessage ?? "internal error";
        logger.error(err, `${event} failed`);
        if (opts?.emitInternalError !== false) emitError(socket, "INTERNAL", message);
        ackFail(ack, message);
      }
    };
    (socket.on as unknown as (e: string, l: (payload: unknown, ack?: Ack) => void) => void)(event, listener);
  };

  return { io, socket, userId, on };
}
