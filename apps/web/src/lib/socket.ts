import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@oruclass/types";
import { getAccessToken } from "@/lib/token-storage";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
};


export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(getBaseUrl(), {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        token: getAccessToken() ?? "",
      },
    });
  }
  return socket;
}

export function connectSocket(): AppSocket {
  const s = getSocket();
  // Always send the latest token on connect/reconnect
  s.auth = { token: getAccessToken() ?? "" };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
