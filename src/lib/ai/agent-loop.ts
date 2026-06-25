/* eslint-disable @typescript-eslint/no-explicit-any */
import type Groq from "groq-sdk";
import type { GoogleGenAI } from "@google/genai";
import {
  TOOL_REGISTRY,
  toOpenAISchema,
  toGeminiSchema,
  runTool,
  type ToolContext,
  type ToolResult,
} from "./tools";

/**
 * Agentic tool-calling loop (blueprint §4).
 * Maks ~5 step/turn; jika budget habis, paksa satu jawaban final tanpa tools.
 * Read-only di Fase 2 — write/approval ditambahkan di fase berikutnya.
 */

export const MAX_STEPS = 5;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AgentTrace = { name: string; args: unknown; result: ToolResult };

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type AgentRunResult = {
  content: string;
  steps: number;
  toolCalls: AgentTrace[];
  usage: TokenUsage;
};

function emptyUsage(): TokenUsage {
  return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
}

type CommonOpts = {
  model: string;
  systemPrompt: string;
  history: ChatMessage[];
  userMessage: string;
  ctx: ToolContext;
  temperature: number;
  maxTokens: number;
  maxSteps?: number;
};

// ---------- Groq (OpenAI-compatible tool calling) ----------

export async function runGroqAgent(
  groq: Groq,
  opts: CommonOpts,
): Promise<AgentRunResult> {
  const maxSteps = opts.maxSteps ?? MAX_STEPS;
  const tools = TOOL_REGISTRY.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: toOpenAISchema(t.params),
    },
  }));

  const messages: any[] = [
    { role: "system", content: opts.systemPrompt },
    ...opts.history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: opts.userMessage },
  ];

  const toolCalls: AgentTrace[] = [];
  const usage = emptyUsage();
  let steps = 0;

  const addGroqUsage = (u: any) => {
    usage.promptTokens += u?.prompt_tokens ?? 0;
    usage.completionTokens += u?.completion_tokens ?? 0;
    usage.totalTokens += u?.total_tokens ?? 0;
  };

  while (steps < maxSteps) {
    const resp = await groq.chat.completions.create({
      model: opts.model,
      messages,
      tools,
      tool_choice: "auto",
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
    });
    addGroqUsage(resp.usage);

    const msg = resp.choices[0]?.message;
    if (!msg) break;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return { content: msg.content ?? "Tidak ada respon dari AI.", steps, toolCalls, usage };
    }

    messages.push(msg);
    for (const tc of msg.tool_calls) {
      let args: unknown = {};
      try {
        args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
      } catch {
        args = {};
      }
      const result = await runTool(tc.function.name, args, opts.ctx);
      toolCalls.push({ name: tc.function.name, args, result });
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      });
    }
    steps++;
  }

  // Budget habis -> paksa jawaban final tanpa tools.
  const final = await groq.chat.completions.create({
    model: opts.model,
    messages,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
  });
  addGroqUsage(final.usage);
  return {
    content: final.choices[0]?.message?.content ?? "Tidak ada respon dari AI.",
    steps,
    toolCalls,
    usage,
  };
}

// ---------- Gemini (functionDeclarations) ----------

export async function runGeminiAgent(
  genai: GoogleGenAI,
  opts: CommonOpts,
): Promise<AgentRunResult> {
  const maxSteps = opts.maxSteps ?? MAX_STEPS;
  const functionDeclarations = TOOL_REGISTRY.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: toGeminiSchema(t.params) as any,
  }));

  const baseConfig = {
    temperature: opts.temperature,
    maxOutputTokens: opts.maxTokens,
    systemInstruction: opts.systemPrompt,
  };
  const config: any = {
    ...baseConfig,
    tools: [{ functionDeclarations }],
  };

  const contents: any[] = [
    ...opts.history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: opts.userMessage }] },
  ];

  const toolCalls: AgentTrace[] = [];
  const usage = emptyUsage();
  let steps = 0;

  const addGeminiUsage = (m: any) => {
    usage.promptTokens += m?.promptTokenCount ?? 0;
    usage.completionTokens += m?.candidatesTokenCount ?? 0;
    usage.totalTokens += m?.totalTokenCount ?? 0;
  };

  while (steps < maxSteps) {
    const resp = await genai.models.generateContent({
      model: opts.model,
      contents,
      config,
    });
    addGeminiUsage(resp.usageMetadata);

    const calls = resp.functionCalls;
    if (!calls || calls.length === 0) {
      return { content: resp.text ?? "Tidak ada respon dari AI.", steps, toolCalls, usage };
    }

    // Turn model (berisi functionCall) lalu turn user (functionResponse).
    const modelParts =
      resp.candidates?.[0]?.content?.parts ?? calls.map((c) => ({ functionCall: c }));
    contents.push({ role: "model", parts: modelParts });

    const responseParts: any[] = [];
    for (const call of calls) {
      const name = call.name ?? "";
      const result = await runTool(name, call.args ?? {}, opts.ctx);
      toolCalls.push({ name, args: call.args, result });
      responseParts.push({
        functionResponse: { name, response: result as Record<string, unknown> },
      });
    }
    contents.push({ role: "user", parts: responseParts });
    steps++;
  }

  // Budget habis -> paksa jawaban final tanpa tools.
  const final = await genai.models.generateContent({
    model: opts.model,
    contents,
    config: baseConfig,
  });
  addGeminiUsage(final.usageMetadata);
  return {
    content: final.text ?? "Tidak ada respon dari AI.",
    steps,
    toolCalls,
    usage,
  };
}
