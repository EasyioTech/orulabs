"use client";

import { useLiveSessionStore } from "@/store/liveSession";
import { cn } from "@oruclass/utils";

export function ParticipantGrid() {
  const participants = useLiveSessionStore((s) => s.participants);
  const list = Array.from(participants.values());
  const online = list.filter((p) => p.connectionStatus === "online").length;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">People</h3>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-md border border-green-100">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-green-700">{online} Online</span>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-500">No participants yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {list.map((p) => {
            const initials = (p.name || p.userId.slice(0, 2)).slice(0, 2).toUpperCase();
            return (
              <div
                key={p.userId}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-colors group"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-700">
                    {initials}
                  </div>
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white",
                      p.connectionStatus === "online" ? "bg-green-500" : "bg-gray-300",
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate font-medium">
                    {p.name || `User ${p.userId.slice(0, 6)}`}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    Joined at {new Date(p.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {p.role === "trainer" && (
                  <span className="text-[10px] bg-brand-600 text-white border border-brand-600 px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">
                    Trainer
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
