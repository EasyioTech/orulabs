"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Terminal, Cpu, CircleDashed } from "lucide-react";
import axios from "axios";
import { cn } from "@oruclass/utils";
import { useAIStore } from "../../stores/useAIStore";
import { apiClient } from "@/lib/api-client";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  isExecuting?: boolean;
}

export function WorkspaceAgent({ workspaceId }: { workspaceId: string }) {
  const { selectedModelId, customModelName, customBaseUrl, apiKey, provider } = useAIStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "agent",
      content: "Hello. I am your Workspace Agent. I have full context of this workspace. How can I assist you today? (Try: 'Create a new training session called Onboarding')",
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: userMsg }]);
    setIsProcessing(true);

    let responseMsg = "";

    try {
      if (!apiKey) throw new Error("No API key set. Go to Engine Setup to configure one.");
      const model = selectedModelId === "custom" ? (customModelName || "gpt-4o") : selectedModelId;
      const history = messages.slice(-10).map((m) => ({ role: m.role === "user" ? "user" : "assistant" as const, content: m.content }));
      const { data } = await apiClient.post<{ reply: string; error?: string }>("/api/ai/chat", {
        message: userMsg,
        provider,
        model,
        apiKey,
        ...(customBaseUrl ? { baseUrl: customBaseUrl } : {}),
        history,
        context: { workspaceId },
      });
      if (data.error) throw new Error(data.error);
      responseMsg = data.reply;
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : err instanceof Error ? err.message : String(err);
      responseMsg = `Error: ${msg}`;
    }

    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "agent", content: responseMsg }]);
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col font-sans w-full max-w-4xl h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-50 border border-gray-200">
            <Cpu className="text-gray-700" size={16} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              Workspace Agent
              <span className="text-[10px] bg-[#e6f4ea] text-[#137333] px-1.5 py-0.5 rounded font-medium tracking-wide">
                ONLINE
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Status: {isProcessing ? "PROCESSING" : "IDLE"} 
              <span className="ml-2">
                • {selectedModelId === "custom" ? customModelName || "Custom" : selectedModelId}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pr-4 -mr-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-200",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "relative max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] shadow-sm border",
                msg.role === "user"
                  ? "bg-[#1a73e8] text-white rounded-br-sm border-transparent"
                  : "bg-white text-gray-900 rounded-bl-sm border-gray-200"
              )}
            >
              {msg.isExecuting ? (
                <div className="flex items-center gap-2 text-gray-600 font-mono text-xs">
                  <CircleDashed className="animate-spin" size={14} />
                  {msg.content}
                </div>
              ) : (
                <div className="leading-relaxed">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        {isProcessing && !messages.find(m => m.isExecuting) && (
          <div className="flex w-full justify-start animate-in fade-in">
            <div className="flex gap-1.5 rounded-2xl rounded-bl-sm bg-white border border-gray-200 px-5 py-4 shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="pt-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder={apiKey ? "Message Workspace Agent..." : "Command the workspace agent (simulated mode)..."}
            className="w-full bg-white border border-gray-300 rounded-xl px-5 py-3.5 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all shadow-sm disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-lg text-white bg-[#1a73e8] hover:bg-[#1557b0] disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            <Send size={16} className={input.trim() && !isProcessing ? "ml-1" : ""} />
          </button>
        </form>
      </div>
    </div>
  );
}
