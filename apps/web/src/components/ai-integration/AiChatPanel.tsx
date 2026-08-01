"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, Settings2, Bot, Loader2 } from "lucide-react";
import axios from "axios";
import { cn } from "@oruclass/utils";
import { useAIStore } from "@/stores/useAIStore";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { useWorkspaceStore } from "@/store/workspace";
import { useParams } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  onClose: () => void;
}

export function AiChatPanel({ onClose }: Props) {
  const { selectedModelId, customModelName, customBaseUrl, apiKey, provider } = useAIStore();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const params = useParams();
  const trainingId = (params?.id as string) ?? undefined;

  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      content: "Hi! I'm your OruClass assistant. I can create trainings, add modules, analyze data, and more. How can I help?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    setHistory((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      if (!apiKey) throw new Error("No API key configured. Go to Settings → AI & Data Analysis → Engine Setup.");

      const model = selectedModelId === "custom" ? (customModelName || "gpt-4o") : selectedModelId;
      const { data } = await apiClient.post<{ reply: string; error?: string }>("/api/ai/chat", {
        message: msg,
        provider,
        model,
        apiKey,
        ...(customBaseUrl ? { baseUrl: customBaseUrl } : {}),
        history: history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        context: {
          workspaceId: activeWorkspaceId ?? undefined,
          trainingId,
          page: typeof window !== "undefined" ? window.location.pathname : undefined,
        },
      });

      if (data.error) throw new Error(data.error);
      setHistory((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: data.reply }]);
    } catch (err: unknown) {
      const errMsg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : err instanceof Error ? err.message : "Something went wrong";
      setHistory((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const hasKey = !!apiKey;

  return (
    <div className="flex flex-col h-full bg-white font-sans border-l border-gray-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
            <Bot size={16} className="text-gray-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 tracking-tight">Workspace AI</p>
            <p className="text-[11px] text-gray-500">
              {provider === "openai" ? "OpenAI" : "Anthropic"} · {selectedModelId === "custom" ? customModelName || "Custom" : selectedModelId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {activeWorkspaceId && (
            <Link
              href={`/workspaces/${activeWorkspaceId}/settings?tab=ai-integration`}
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              title="AI Settings"
            >
              <Settings2 size={16} />
            </Link>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* No API key banner */}
      {!hasKey && (
        <div className="mx-3 mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex-shrink-0">
          No API key configured.{" "}
          {activeWorkspaceId && (
            <Link
              href={`/workspaces/${activeWorkspaceId}/settings?tab=ai-integration`}
              onClick={onClose}
              className="underline font-medium"
            >
              Set it up →
            </Link>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {history.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-[#1a73e8] text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-900 rounded-bl-sm"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg rounded-bl-sm px-3.5 py-3.5 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3 bg-white">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Message Workspace AI..."
            className="flex-1 px-3 py-2.5 text-sm bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] disabled:opacity-60 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 border border-transparent hover:border-gray-300 text-[#1a73e8] rounded disabled:opacity-40 transition-colors flex-shrink-0"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
