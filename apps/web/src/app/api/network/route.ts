import { NextResponse } from "next/server";
import os from "os";

// Returns the best URL for joining: LAN IP in dev, domain in production.
// Priority:
//   1. NEXT_PUBLIC_WEB_URL (set to https://yourdomain.com in production)
//   2. Auto-detected LAN IP (dev — works from phones on the same network)
//   3. localhost fallback
export function GET() {
  const configured = process.env.NEXT_PUBLIC_WEB_URL;
  if (configured && !configured.includes("localhost") && !configured.includes("127.0.0.1")) {
    return NextResponse.json({ webUrl: configured.replace(/\/$/, "") });
  }

  const interfaces = os.networkInterfaces();
  let lanIp: string | null = null;

  outer: for (const addrs of Object.values(interfaces)) {
    for (const addr of addrs ?? []) {
      if (addr.family === "IPv4" && !addr.internal) {
        lanIp = addr.address;
        break outer;
      }
    }
  }

  const port = process.env.PORT ?? "3000";
  const webUrl = lanIp ? `http://${lanIp}:${port}` : `http://localhost:${port}`;
  return NextResponse.json({ webUrl });
}
