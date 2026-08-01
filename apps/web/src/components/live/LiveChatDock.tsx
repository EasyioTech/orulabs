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
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-2 text-gray-700">
          <Move size={14} className="opacity-40 cursor-grab" />
          <MessageSquare size={16} />
          <span className="text-[15px] font-semibold">In-call messages</span>
          {messages.length > 0 && (
            <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              {messages.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setMinimized((v) => !v)}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition-colors"
          >
            {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-red-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-3">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
              <MessageSquare size={24} className="text-gray-300" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-600">Messages can only be seen</p>
              <p className="text-[13px] text-gray-500">by people in the call and are deleted when the call ends.</p>
            </div>
          </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.userId === user?.id;
                return (
                  <div key={msg.id} className={cn("flex flex-col gap-1", isMe && "items-end")}>
                    <div className="flex items-baseline gap-2 px-1">
                      {!isMe && (
                        <span className="text-[12px] text-gray-800 font-semibold">
                          {msg.senderName}
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {format(new Date(msg.sentAt), "h:mm a")}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "max-w-[85%] px-3.5 py-2 rounded-2xl text-[14px] leading-relaxed break-words",
                        isMe
                          ? "bg-[#e8f0fe] text-[#1a73e8] rounded-tr-sm"
                          : "bg-gray-100 text-gray-900 rounded-tl-sm"
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="px-4 py-3 bg-white flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder="Send a message"
                className="flex-1 text-[14px] bg-transparent outline-none py-1.5 placeholder:text-gray-500 text-gray-900"
                maxLength={2000}
              />
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={sendMessage}
                disabled={!draft.trim()}
                className={cn(
                  "flex items-center justify-center rounded-full transition-colors",
                  draft.trim() ? "text-brand-600 hover:bg-brand-50 p-2" : "text-gray-400 cursor-not-allowed p-2"
                )}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
