"use client";

import { useState } from "react";
import type { Training } from "@oruclass/types";
import { useLiveSessionStore } from "@/store/liveSession";
import { cn } from "@oruclass/utils";
import {
  MessageSquare,
  Mic,
  MicOff,
  Camera,
  MonitorUp,
  QrCode,
  Hand,
  PhoneOff,
} from "lucide-react";

interface Props {
  training: Training;
  videoOpen: boolean;
  qrOpen: boolean;
  chatOpen: boolean;
  chatUnread: number;
  onToggleVideo: () => void;
  onToggleQr: () => void;
  onToggleChat: () => void;
  onTogglePause: () => void;
  pausePending: boolean;
  onLeave: () => void;
}

const CTRL_BASE = "w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm";
const CTRL_IDLE = "bg-gray-100 text-gray-700 hover:bg-gray-200";
const CTRL_ACTIVE = "bg-[#e8f0fe] text-[#1a73e8]";

function ChatButton({ open, unread, onClick, bare }: { open: boolean; unread: number; onClick: () => void; bare?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center transition-colors relative",
        !bare && "shadow-sm",
        open ? CTRL_ACTIVE : bare ? "bg-white text-gray-500 hover:bg-gray-100" : CTRL_IDLE,
      )}
      title="Toggle Chat"
    >
      <MessageSquare size={18} />
      {unread > 0 && !open && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}

/** Google-Meet-style bottom bar. Online trainings get A/V + video-dock controls;
 *  in-person trainings get QR + pause + chat. Mic/camera are local placeholders. */
export function TrainerControlBar({
  training,
  videoOpen,
  qrOpen,
  chatOpen,
  chatUnread,
  onToggleVideo,
  onToggleQr,
  onToggleChat,
  onTogglePause,
  pausePending,
  onLeave,
}: Props) {
  const [micMuted, setMicMuted] = useState(false);
  const [cameraMuted, setCameraMuted] = useState(false);
  const isPaused = useLiveSessionStore((s) => s.isPaused);
  const isOnline = training.type !== "in_person";

  return (
    <div className="h-16 border-t border-gray-100 bg-white flex items-center justify-between px-6 flex-shrink-0 z-20 w-full">
      <div className="w-1/3 min-w-0 flex items-center justify-start">
        <span className="text-[14px] text-gray-700 truncate block font-medium">
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &bull; {training.title}
        </span>
      </div>

      <div className="w-1/3 min-w-0 flex items-center justify-center gap-3">
        {isOnline ? (
          <>
            <button
              onClick={() => {
                setMicMuted((v) => !v);
                alert(`Microphone ${!micMuted ? "muted" : "unmuted"}`);
              }}
              className={cn(CTRL_BASE, micMuted ? "bg-red-500 text-white hover:bg-red-600" : CTRL_IDLE)}
              title="Toggle Microphone"
            >
              {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={() => {
                setCameraMuted((v) => !v);
                alert(`Camera ${!cameraMuted ? "turned off" : "turned on"}`);
              }}
              className={cn(CTRL_BASE, cameraMuted ? "bg-red-500 text-white hover:bg-red-600" : CTRL_IDLE)}
              title="Toggle Camera"
            >
              <Camera size={18} />
            </button>
            <button
              onClick={onToggleVideo}
              className={cn(CTRL_BASE, videoOpen ? CTRL_ACTIVE : CTRL_IDLE)}
              title="Toggle Video Panel"
            >
              <MonitorUp size={18} />
            </button>
            <button
              onClick={onLeave}
              className="w-12 h-10 rounded-[20px] flex items-center justify-center transition-colors bg-red-500 text-white hover:bg-red-600 shadow-sm ml-2"
              title="Leave Call"
            >
              <PhoneOff size={18} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onToggleQr}
              className={cn(CTRL_BASE, qrOpen ? CTRL_ACTIVE : CTRL_IDLE)}
              title="Show Join QR Code"
            >
              <QrCode size={18} />
            </button>
            <button
              onClick={onTogglePause}
              disabled={pausePending}
              className={cn(CTRL_BASE, isPaused ? "bg-amber-100 text-amber-700" : CTRL_IDLE)}
              title={isPaused ? "Unpause Room" : "Pause Room"}
            >
              <Hand size={18} />
            </button>
            <ChatButton open={chatOpen} unread={chatUnread} onClick={onToggleChat} />
          </>
        )}
      </div>

      <div className="w-1/3 min-w-0 flex items-center justify-end gap-3">
        {isOnline && <ChatButton open={chatOpen} unread={chatUnread} onClick={onToggleChat} bare />}
      </div>
    </div>
  );
}
