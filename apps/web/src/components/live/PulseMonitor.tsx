"use client";

import { useLiveSessionStore } from "@/store/liveSession";

export function PulseMonitor() {
  const online = useLiveSessionStore((s) =>
    Array.from(s.participants.values()).filter((p) => p.connectionStatus === "online").length
  );

  return (
    <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
      <span className="relative inline-flex w-2 h-2">
        {online > 0 && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
        )}
        <span
          className={`relative inline-flex rounded-full w-2 h-2 ${online > 0 ? "bg-green-500" : "bg-gray-300"}`}
        />
      </span>
      <span className="font-medium">{online} online</span>
    </div>
  );
}
