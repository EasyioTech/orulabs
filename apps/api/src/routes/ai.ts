import type { AppEnv } from "../types/hono";
import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth";
import { db } from "../db/client";
import {
  trainings,
  trainingModules,
  trainingDays,
  trainingFacilitators,
  workspaceMembers,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import type { ModuleType } from "@oruclass/types";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export const aiRouter = new Hono<AppEnv>();

aiRouter.use("*", authMiddleware);

// ── tool definitions (shared schema) ─────────────────────────────────────────

const TOOLS_OPENAI: OpenAI.Chat.ChatCompletionFunctionTool[] = [
  {
    type: "function",
    function: {
      name: "list_trainings",
      description: "List all trainings in the user's workspace",
      parameters: {
        type: "object",
        properties: {
          workspaceId: { type: "string", description: "The workspace ID to list trainings from" },
        },
        required: ["workspaceId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_training",
      description: "Create a new training session in a workspace",
      parameters: {
        type: "object",
        properties: {
          workspaceId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          type: { type: "string", enum: ["online", "in_person", "hybrid"], description: "Delivery type" },
        },
        required: ["workspaceId", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_training_details",
      description: "Get modules and details for a specific training",
      parameters: {
        type: "object",
        properties: {
          trainingId: { type: "string" },
        },
        required: ["trainingId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_module",
      description: "Add a module to an existing training. Module types: attendance, pulse, wordcloud, quiz, embed, reflection, document, timer, code, whiteboard, mapping, matrix, qna, poll, form",
      parameters: {
        type: "object",
        properties: {
          trainingId: { type: "string" },
          title: { type: "string" },
          moduleType: {
            type: "string",
            enum: ["attendance", "pulse", "wordcloud", "quiz", "embed", "reflection", "document", "timer", "code", "whiteboard", "mapping", "matrix", "qna", "poll", "form"],
          },
        },
        required: ["trainingId", "title", "moduleType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_training_responses",
      description: "Get aggregated response data for a training (for analysis)",
      parameters: {
        type: "object",
        properties: {
          trainingId: { type: "string" },
        },
        required: ["trainingId"],
      },
    },
  },
];

const TOOLS_ANTHROPIC: Anthropic.Tool[] = TOOLS_OPENAI.map((t) => ({
  name: t.function.name,
  description: t.function.description ?? "",
  input_schema: t.function.parameters as Anthropic.Tool["input_schema"],
}));

// ── tool execution ────────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, unknown>, userId: string): Promise<string> {
  try {
    if (name === "list_trainings") {
      const workspaceId = args.workspaceId as string;
      const member = await db.query.workspaceMembers.findFirst({
        where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
      });
      if (!member) return JSON.stringify({ error: "Access denied" });
      const rows = await db.query.trainings.findMany({
        where: eq(trainings.workspaceId, workspaceId),
        columns: { id: true, title: true, sessionStatus: true, type: true, createdAt: true },
      });
      return JSON.stringify(rows);
    }

    if (name === "create_training") {
      const workspaceId = args.workspaceId as string;
      const member = await db.query.workspaceMembers.findFirst({
        where: and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
      });
      if (!member) return JSON.stringify({ error: "Access denied" });
      const { randomBytes } = await import("crypto");
      const joinToken = randomBytes(12).toString("base64url");
      const [training] = await db.insert(trainings).values({
        workspaceId,
        title: args.title as string,
        description: (args.description as string) || "",
        type: (args.type as "online" | "in_person" | "hybrid") || "online",
        joinToken,
        createdBy: userId,
        sessionStatus: "draft",
      }).returning({ id: trainings.id, title: trainings.title });
      await db.insert(trainingFacilitators).values({ trainingId: training.id, userId, role: "lead_trainer" });
      return JSON.stringify({ success: true, training });
    }

    if (name === "get_training_details") {
      const trainingId = args.trainingId as string;
      const facilitator = await db.query.trainingFacilitators.findFirst({
        where: and(eq(trainingFacilitators.trainingId, trainingId), eq(trainingFacilitators.userId, userId)),
      });
      if (!facilitator) return JSON.stringify({ error: "Access denied" });
      const modules = await db.query.trainingModules.findMany({
        where: eq(trainingModules.trainingId, trainingId),
        columns: { id: true, title: true, moduleType: true, position: true },
      });
      return JSON.stringify({ modules });
    }

    if (name === "add_module") {
      const trainingId = args.trainingId as string;
      const facilitator = await db.query.trainingFacilitators.findFirst({
        where: and(eq(trainingFacilitators.trainingId, trainingId), eq(trainingFacilitators.userId, userId)),
      });
      if (!facilitator) return JSON.stringify({ error: "Access denied" });
      let day = await db.query.trainingDays.findFirst({ where: eq(trainingDays.trainingId, trainingId) });
      if (!day) {
        const [newDay] = await db.insert(trainingDays).values({ trainingId, dayNumber: 1, title: "Day 1", deliveryMode: "online" }).returning();
        day = newDay;
      }
      const existingModules = await db.query.trainingModules.findMany({ where: eq(trainingModules.trainingId, trainingId), columns: { position: true } });
      const position = existingModules.length;
      const [mod] = await db.insert(trainingModules).values({
        trainingId,
        dayId: day.id,
        title: args.title as string,
        moduleType: args.moduleType as ModuleType,
        position,
        config: {},
      }).returning({ id: trainingModules.id, title: trainingModules.title, moduleType: trainingModules.moduleType });
      return JSON.stringify({ success: true, module: mod });
    }

    if (name === "get_training_responses") {
      const trainingId = args.trainingId as string;
      const facilitator = await db.query.trainingFacilitators.findFirst({
        where: and(eq(trainingFacilitators.trainingId, trainingId), eq(trainingFacilitators.userId, userId)),
      });
      if (!facilitator) return JSON.stringify({ error: "Access denied" });
      const modules = await db.query.trainingModules.findMany({
        where: eq(trainingModules.trainingId, trainingId),
        columns: { id: true, title: true, moduleType: true },
        with: { responses: { columns: { id: true, responseData: true } } },
      });
      return JSON.stringify(modules.map((m) => ({ ...m, responseCount: m.responses.length })));
    }

    return JSON.stringify({ error: `Unknown tool: ${name}` });
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
}

// ── system prompt ─────────────────────────────────────────────────────────────

const SYSTEM = `You are OruClass Assistant, an AI embedded in OruClass — a live training platform. You help trainers manage their workspace.

You can:
- List, create, and explore training sessions
- Add modules (quiz, poll, whiteboard, QnA, etc.) to trainings
- Analyze response data from training sessions

When the user asks you to do something, use the available tools to do it. Be concise and action-oriented. After executing a tool, briefly confirm what was done.`;

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────

aiRouter.post("/chat", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    message: string;
    provider: "openai" | "anthropic" | "gemini" | "groq";
    model: string;
    apiKey: string;
    baseUrl?: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
    context?: { workspaceId?: string; trainingId?: string; page?: string };
  }>();

  const { message, provider, model, apiKey, baseUrl, history = [], context } = body;

  if (!message || !apiKey || !provider || !model) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const contextNote = context?.page ? `\nUser is currently on: ${context.page}${context.trainingId ? ` (trainingId: ${context.trainingId})` : ""}${context.workspaceId ? ` (workspaceId: ${context.workspaceId})` : ""}` : "";

  try {
    // Groq and Gemini use OpenAI-compatible APIs
    const PROVIDER_BASE_URLS: Record<string, string> = {
      groq: "https://api.groq.com/openai/v1",
      gemini: "https://generativelanguage.googleapis.com/v1beta/openai/",
    };

    if (provider === "openai" || provider === "groq" || provider === "gemini") {
      const resolvedBaseUrl = baseUrl || PROVIDER_BASE_URLS[provider];
      const client = new OpenAI({ apiKey, ...(resolvedBaseUrl ? { baseURL: resolvedBaseUrl } : {}) });
      const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM + contextNote },
        ...history.map((h) => ({ role: h.role, content: h.content }) as OpenAI.Chat.ChatCompletionMessageParam),
        { role: "user", content: message },
      ];

      let response = await client.chat.completions.create({ model, messages: msgs, tools: TOOLS_OPENAI });
      let msg = response.choices[0].message;

      // tool loop
      while (msg.tool_calls?.length) {
        msgs.push(msg);
        for (const call of msg.tool_calls) {
          if (call.type !== "function") continue;
          const fnCall = call as OpenAI.Chat.ChatCompletionMessageFunctionToolCall;
          const result = await executeTool(fnCall.function.name, JSON.parse(fnCall.function.arguments), userId);
          msgs.push({ role: "tool", tool_call_id: call.id, content: result });
        }
        response = await client.chat.completions.create({ model, messages: msgs, tools: TOOLS_OPENAI });
        msg = response.choices[0].message;
      }

      return c.json({ reply: msg.content ?? "" });
    }

    if (provider === "anthropic") {
      const client = new Anthropic({ apiKey });
      const antMsgs: Anthropic.MessageParam[] = [
        ...history.map((h) => ({ role: h.role, content: h.content }) as Anthropic.MessageParam),
        { role: "user", content: message },
      ];

      let response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: SYSTEM + contextNote,
        tools: TOOLS_ANTHROPIC,
        messages: antMsgs,
      });

      // tool loop
      while (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
        antMsgs.push({ role: "assistant", content: response.content });
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of toolUseBlocks) {
          const result = await executeTool(block.name, block.input as Record<string, unknown>, userId);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        }
        antMsgs.push({ role: "user", content: toolResults });
        response = await client.messages.create({
          model,
          max_tokens: 1024,
          system: SYSTEM + contextNote,
          tools: TOOLS_ANTHROPIC,
          messages: antMsgs,
        });
      }

      const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
      return c.json({ reply: textBlock?.text ?? "" });
    }

    return c.json({ error: "Unsupported provider" }, 400);
  } catch (err: unknown) {
    console.error("[AI] error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});
