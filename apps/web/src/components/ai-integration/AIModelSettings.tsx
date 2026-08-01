"use client";

import { useState } from "react";
import {
  CheckCircle2, Key, Eye, EyeOff,
  AlertCircle, Loader2, Info
} from "lucide-react";
import axios from "axios";
import { cn } from "@oruclass/utils";
import { useAIStore, type AiProvider } from "../../stores/useAIStore";
import { apiClient } from "@/lib/api-client";

// ── model catalogue ────────────────────────────────────────────────────────────

interface ModelDef {
  id: string;
  name: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
}

const MODELS: Record<AiProvider, ModelDef[]> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o", subtitle: "Flagship multimodal", badge: "Best" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", subtitle: "Fast & cheap", badge: "Fast" },
    { id: "o1", name: "o1", subtitle: "Deep reasoning", badge: "Reasoning" },
    { id: "o3-mini", name: "o3-mini", subtitle: "Fast reasoning", badge: "Reasoning" },
    { id: "custom", name: "Custom", subtitle: "Any OpenAI-compatible endpoint" },
  ],
  anthropic: [
    { id: "claude-opus-4-8", name: "Claude Opus 4.8", subtitle: "Most capable", badge: "Powerful" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", subtitle: "Balanced", badge: "Best" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", subtitle: "Fastest", badge: "Fast" },
    { id: "custom", name: "Custom", subtitle: "Any Anthropic model ID" },
  ],
  gemini: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", subtitle: "Fast, free tier available", badge: "Free" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", subtitle: "Most capable Gemini", badge: "Best" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", subtitle: "Speed-optimised", badge: "Fast" },
    { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", subtitle: "Lightest model", badge: "Free" },
    { id: "custom", name: "Custom", subtitle: "Any Gemini model ID" },
  ],
  groq: [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", subtitle: "Best Llama model", badge: "Free" },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", subtitle: "Fastest on Groq", badge: "Fast" },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", subtitle: "Long context (32k)", badge: "Free" },
    { id: "gemma2-9b-it", name: "Gemma 2 9B", subtitle: "Google's open model", badge: "Free" },
    { id: "custom", name: "Custom", subtitle: "Any Groq model ID" },
  ],
};

const PROVIDERS: { id: AiProvider; label: string; keyHint: string; keyPrefix: string; getKeyUrl: string }[] = [
  { id: "openai",    label: "OpenAI",    keyHint: "sk-...",       keyPrefix: "sk-",      getKeyUrl: "https://platform.openai.com/api-keys" },
  { id: "anthropic", label: "Anthropic", keyHint: "sk-ant-...",   keyPrefix: "sk-ant-",  getKeyUrl: "https://console.anthropic.com/settings/keys" },
  { id: "gemini",    label: "Google Gemini", keyHint: "AIza...",      keyPrefix: "AIza",     getKeyUrl: "https://aistudio.google.com/app/apikey" },
  { id: "groq",      label: "Groq",      keyHint: "gsk_...",      keyPrefix: "gsk_",     getKeyUrl: "https://console.groq.com/keys" },
];

// ── validation ─────────────────────────────────────────────────────────────────

function validateKey(key: string, provider: AiProvider): string | null {
  if (!key.trim()) return "API key is required";
  const p = PROVIDERS.find((x) => x.id === provider)!;
  if (!key.startsWith(p.keyPrefix)) return `${p.label} keys start with "${p.keyPrefix}"`;
  return null;
}

// ── component ──────────────────────────────────────────────────────────────────

export function AIModelSettings() {
  const {
    selectedModelId, setSelectedModelId,
    apiKey, setApiKey,
    customModelName, setCustomModelName,
    customBaseUrl, setCustomBaseUrl,
    provider, setProvider,
    enabled, setEnabled,
  } = useAIStore();

  const [showKey, setShowKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [customNameError, setCustomNameError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const models = MODELS[provider];
  const isCustom = selectedModelId === "custom";
  const providerMeta = PROVIDERS.find((p) => p.id === provider)!;

  const handleProviderChange = (p: AiProvider) => {
    setProvider(p);
    setSelectedModelId(MODELS[p][0].id);
    setKeyError(null);
    setTestResult(null);
  };

  const handleKeyChange = (val: string) => {
    setApiKey(val);
    if (keyError) setKeyError(validateKey(val, provider));
    setTestResult(null);
  };

  const handleSave = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const kErr = validateKey(apiKey, provider);
    if (kErr) { setKeyError(kErr); return; }
    if (isCustom && !customModelName.trim()) {
      setCustomNameError("Model name / ID is required");
      return;
    }
    setKeyError(null);
    setCustomNameError(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    const kErr = validateKey(apiKey, provider);
    if (kErr) { setKeyError(kErr); return; }
    const model = isCustom ? (customModelName || "") : selectedModelId;
    if (!model) { setCustomNameError("Model name is required to test"); return; }

    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await apiClient.post<{ reply: string; error?: string }>("/api/ai/chat", {
        message: "Reply with exactly: ok",
        provider,
        model,
        apiKey,
        ...(customBaseUrl ? { baseUrl: customBaseUrl } : {}),
        history: [],
        context: {},
      });
      if (data.error) throw new Error(data.error);
      setTestResult({ ok: true, msg: "Connection successful" });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? err.message)
        : err instanceof Error ? err.message : "Test failed";
      setTestResult({ ok: false, msg });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-300 bg-white shadow-sm max-w-4xl font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-xl font-normal text-gray-800 tracking-tight">AI Model Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">Manage API keys and select default models for your workspace.</p>
        </div>
        <label className="flex items-center cursor-pointer gap-3">
          <span className="text-sm font-medium text-gray-700">{enabled ? "Enabled" : "Disabled"}</span>
          <div className="relative">
            <input type="checkbox" className="sr-only" checked={enabled} onChange={() => setEnabled(!enabled)} />
            <div className={cn("block w-10 h-6 rounded-full transition-colors duration-200", enabled ? "bg-[#1a73e8]" : "bg-gray-300")}></div>
            <div className={cn("absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 shadow-sm", enabled ? "translate-x-4" : "")}></div>
          </div>
        </label>
      </div>

      <form onSubmit={handleSave} className="px-6 py-6 space-y-8">
        
        {/* Provider Tabs (Google Material Style) */}
        <div>
          <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProviderChange(p.id)}
                className={cn(
                  "px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                  provider === p.id
                    ? "border-[#1a73e8] text-[#1a73e8]"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {(provider === "gemini" || provider === "groq") && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50/50 text-[#1a73e8] rounded-md text-sm border border-blue-100/50">
              <Info size={18} className="mt-0.5 shrink-0" />
              <p>
                {provider === "gemini"
                  ? "Gemini 2.0 Flash has a free tier — get your API key at aistudio.google.com"
                  : "Groq offers free API access for most models — get your key at console.groq.com"}
              </p>
            </div>
          )}
        </div>

        {/* API Key Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-800">API Key</label>
            <a
              href={providerMeta.getKeyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#1a73e8] hover:underline font-medium"
            >
              Get a {providerMeta.label} key
            </a>
          </div>
          <div className="relative max-w-xl">
            <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              onBlur={() => setKeyError(validateKey(apiKey, provider))}
              placeholder={providerMeta.keyHint}
              className={cn(
                "w-full pl-10 pr-10 py-2.5 bg-white border rounded text-sm font-mono placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] transition-colors",
                keyError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-[#1a73e8]"
              )}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              tabIndex={-1}
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {keyError ? (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5"><AlertCircle size={14} /> {keyError}</p>
          ) : (
            <p className="mt-2 text-sm text-gray-500 flex items-center gap-1.5">
              Your key is stored locally in this browser and never sent to our servers.
            </p>
          )}
        </div>

        {/* Models list (Radio button style) */}
        <div>
          <label className="text-sm font-medium text-gray-800 mb-3 block">Default Model</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {models.map((m) => {
              const isSelected = selectedModelId === m.id;
              return (
                <label
                  key={m.id}
                  className={cn(
                    "flex items-start p-4 rounded border cursor-pointer transition-colors",
                    isSelected
                      ? "border-[#1a73e8] bg-blue-50/30"
                      : "border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="model-selection"
                      checked={isSelected}
                      onChange={() => { setSelectedModelId(m.id); setCustomNameError(null); }}
                      className="w-4 h-4 text-[#1a73e8] border-gray-300 focus:ring-[#1a73e8]"
                    />
                  </div>
                  <div className="ml-3 flex flex-col">
                    <span className={cn("text-sm font-medium", isSelected ? "text-[#1a73e8]" : "text-gray-900")}>
                      {m.name}
                    </span>
                    <span className="text-sm text-gray-500 mt-0.5">{m.subtitle}</span>
                  </div>
                  {m.badge && (
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-wider">
                        {m.badge}
                      </span>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Custom model fields */}
        {isCustom && (
          <div className="space-y-5 bg-gray-50 p-5 rounded border border-gray-200">
            <div>
              <label className="text-sm font-medium text-gray-800 mb-1.5 block">Model ID</label>
              <input
                type="text"
                value={customModelName}
                onChange={(e) => { setCustomModelName(e.target.value); setCustomNameError(null); }}
                placeholder={
                  provider === "openai" ? "meta-llama/Llama-3-70b-chat-hf" :
                  provider === "anthropic" ? "claude-3-opus-20240229" :
                  provider === "gemini" ? "gemini-2.0-flash-thinking-exp" :
                  "llama-3.3-70b-specdec"
                }
                className={cn(
                  "w-full max-w-xl px-3 py-2 bg-white border rounded text-sm font-mono placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1a73e8] transition-colors",
                  customNameError ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-[#1a73e8]"
                )}
              />
              {customNameError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5"><AlertCircle size={14} /> {customNameError}</p>
              )}
            </div>
            {(provider === "openai" || provider === "groq") && (
              <div>
                <label className="text-sm font-medium text-gray-800 mb-1.5 block">
                  Base URL <span className="font-normal text-gray-500">(optional)</span>
                </label>
                <input
                  type="url"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder={provider === "groq" ? "https://api.groq.com/openai/v1" : "https://api.together.xyz/v1"}
                  className="w-full max-w-xl px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono placeholder-gray-400 focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-colors"
                />
              </div>
            )}
          </div>
        )}

        {/* Test result */}
        {testResult && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-3 rounded text-sm border",
            testResult.ok ? "bg-[#e6f4ea] border-[#ceead6] text-[#137333]" : "bg-[#fce8e6] border-[#fad2cf] text-[#c5221f]"
          )}>
            {testResult.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {testResult.msg}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className={cn(
              "px-5 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2",
              saved ? "bg-[#137333] hover:bg-[#0d652d] text-white" : "bg-[#1a73e8] hover:bg-[#1557b0] text-white"
            )}
          >
            {saved ? <><CheckCircle2 size={16} /> Saved</> : "Save"}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="px-5 py-2 rounded text-sm font-medium text-[#1a73e8] hover:bg-blue-50 disabled:opacity-50 transition-colors flex items-center gap-2 border border-transparent hover:border-[#1a73e8]"
          >
            {testing ? <><Loader2 size={16} className="animate-spin" /> Testing…</> : "Test connection"}
          </button>
        </div>
      </form>
    </div>
  );
}
