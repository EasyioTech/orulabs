"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, X, Minimize2, Maximize2, Move } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/auth";
import { cn } from "@oruclass/utils";
import { playChatSound } from "@/lib/sounds";
import { format } from "date-fns";

interface ChatMessage {
  id: string;
  userId: string;
  senderName: string;
  text: string;
  sentAt: string;
}

interface Props {
  trainingId: string;
  onClose: () => void;
  onUnreadChange?: React.Dispatch<React.SetStateAction<number>>;
  boundsRef?: React.RefObject<HTMLDivElement | null>;
}

export function LiveChatDock({ trainingId, onClose, onUnreadChange, boundsRef }: Props) {
  const socket = useSocket();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      // Only play sound if the message is not from the current user and dock is minimized
      if (msg.userId !== user?.id) {
        playChatSound();
        if (minimized) {
          onUnreadChange?.((prev) => prev + 1);
        }
      }
    };

    socket.on("chat:message", handleMessage);
    return () => { socket.off("chat:message", handleMessage); };
  }, [socket, user?.id, minimized, onUnreadChange]);

  useEffect(() => {
    if (!minimized) {
      scrollToBottom();
    }
  }, [messages, minimized, scrollToBottom]);

  const sendMessage = () => {
    if (!draft.trim() || !socket) return;
    socket.emit("chat:send", { trainingId, text: draft.trim() });
    setDraft("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={boundsRef}
      dragElastic={0.1}
      dragMomentum={false}
      className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col cursor-move"
      style={{
        bottom: 24,
        left: 24,
        width: minimized ? 220 : 320,
        height: minimized ? 48 : 480,
        touchAction: "none",
        transition: "width 0.25s, height 0.25s",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <Move size={13} className="opacity-60" />
          <MessageSquare size={14} />
          <span className="text-sm font-semibold">Session Chat</span>
          {messages.length > 0 && (
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-medium">
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setMinimized((v) => !v)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="p-1 hover:bg-red-400 rounded transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-2">
                <MessageSquare size={28} className="opacity-30" />
                <p className="text-xs font-medium">No messages yet</p>
                <p className="text-[11px]">Say hello to everyone!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.userId === user?.id;
                return (
                  <div key={msg.id} className={cn("flex flex-col gap-0.5", isMe && "items-end")}>
                    {!isMe && (
                      <span className="text-[10px] text-gray-400 font-semibold px-1">
                        {msg.senderName}
                      </span>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words",
                        isMe
                          ? "bg-brand-600 text-white rounded-tr-sm"
                          : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-sm"
                      )}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-gray-400 px-1">
                      {format(new Date(msg.sentAt), "HH:mm")}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-gray-100 bg-white flex-shrink-0">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              onPointerDown={(e) => e.stopPropagation()}
              placeholder="Message everyone..."
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-gray-400 transition-all"
              maxLength={2000}
            />
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={sendMessage}
              disabled={!draft.trim()}
              className="w-8 h-8 flex items-center justify-center bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Send size={14} />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
