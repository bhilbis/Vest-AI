import { TOOL_REGISTRY } from "./tools";
import type { AgentTrace, TokenUsage } from "./agent-loop";

/**
 * Observability per run (blueprint §13): tools exposed, tool calls + args,
 * permission decision, hasil, token usage, status final, durasi.
 * Di-emit sebagai satu baris JSON terstruktur agar mudah di-grep/diparse.
 */

export type FinalStatus = "answer" | "pending_approval" | "error";

export type RunTrace = {
  ts: string;
  userId: string;
  model: string;
  toolsExposed: string[];
  steps: number;
  toolCalls: {
    name: string;
    permission: string;
    status: string;
    summary: string;
    args: unknown;
  }[];
  tokens: TokenUsage;
  pendingDrafts: number;
  finalStatus: FinalStatus;
  durationMs: number;
};

const PERMISSION_BY_NAME = new Map(TOOL_REGISTRY.map((t) => [t.name, t.permission]));

export function buildRunTrace(input: {
  userId: string;
  model: string;
  steps: number;
  toolCalls: AgentTrace[];
  tokens: TokenUsage;
  pendingDrafts: number;
  finalStatus: FinalStatus;
  durationMs: number;
}): RunTrace {
  return {
    ts: new Date().toISOString(),
    userId: input.userId,
    model: input.model,
    toolsExposed: TOOL_REGISTRY.map((t) => t.name),
    steps: input.steps,
    toolCalls: input.toolCalls.map((t) => ({
      name: t.name,
      permission: PERMISSION_BY_NAME.get(t.name) ?? "unknown",
      status: t.result.status,
      summary: t.result.summary,
      args: t.args,
    })),
    tokens: input.tokens,
    pendingDrafts: input.pendingDrafts,
    finalStatus: input.finalStatus,
    durationMs: input.durationMs,
  };
}

export function logRunTrace(trace: RunTrace) {
  console.log(`[ai-trace] ${JSON.stringify(trace)}`);
}
