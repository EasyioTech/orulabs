import type { Server as SocketIOServer } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from "@oruclass/types";

type IO = SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

let _io: IO | null = null;

export function setIO(io: IO): void {
  _io = io;
}

export function getIO(): IO {
  if (!_io) throw new Error("Socket.IO instance not initialized");
  return _io;
}
