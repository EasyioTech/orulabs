import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AiProvider = "openai" | "anthropic" | "gemini" | "groq";

interface AIStore {
  selectedModelId: string;
  customModelName: string;
  customBaseUrl: string;
  apiKey: string;
  provider: AiProvider;
  enabled: boolean;
  setSelectedModelId: (id: string) => void;
  setCustomModelName: (name: string) => void;
  setCustomBaseUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setProvider: (p: AiProvider) => void;
  setEnabled: (v: boolean) => void;
}

export const useAIStore = create<AIStore>()(
  persist(
    (set) => ({
      selectedModelId: "gpt-4o",
      customModelName: "",
      customBaseUrl: "",
      apiKey: "",
      provider: "openai",
      enabled: true,
      setSelectedModelId: (id) => set({ selectedModelId: id }),
      setCustomModelName: (name) => set({ customModelName: name }),
      setCustomBaseUrl: (url) => set({ customBaseUrl: url }),
      setApiKey: (key) => set({ apiKey: key }),
      setProvider: (provider) => set({ provider }),
      setEnabled: (enabled) => set({ enabled }),
    }),
    { name: "oruclass-ai-settings" }
  )
);
