// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "next-auth";
import { runGroqAgent } from "@/lib/ai/agent-loop";
import { getFinancialSummary } from "@/lib/services/financeSummary";
import { POST } from "@/app/api/ai-context-chat/route";

vi.mock("next-auth");
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/env", () => ({ GEMINI_API_KEY: "test-key", GROQ_API_KEY: "test-key" }));
vi.mock("@/lib/ai/agent-loop", async (orig) => {
  const actual = await orig<any>();
  return { ...actual, runGroqAgent: vi.fn(), runGeminiAgent: vi.fn() };
});
vi.mock("@/lib/services/financeSummary");
vi.mock("@/lib/prisma", () => ({
  prisma: {
    asset: { findMany: vi.fn().mockResolvedValue([]) },
    accountBalance: { findMany: vi.fn().mockResolvedValue([]) },
    semester: { findMany: vi.fn().mockResolvedValue([]) },
    kuliahSettings: { findUnique: vi.fn().mockResolvedValue(null) },
    agentDraft: { create: vi.fn().mockResolvedValue({ id: "draft-test-1" }) },
  },
}));

function makeReq(body: any) {
  return { json: async () => body } as any;
}

const DRAFT = {
  kind: "expense",
  title: "Kopi",
  amount: 25000,
  category: "Makanan",
  accountId: "acc-1",
  accountName: "BCA",
  date: "2026-06-23",
  currentBalance: 100000,
  sufficientBalance: true,
};

describe("ai-context-chat POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "rl-user" } } as any);
    vi.mocked(getFinancialSummary).mockResolvedValue({ netCashFlowRaw: 0 } as any);
    vi.mocked(runGroqAgent).mockResolvedValue({
      content: "Draft dibuat, konfirmasi ya.",
      steps: 1,
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      toolCalls: [
        { name: "draft_expense", args: {}, result: { status: "needs_approval", summary: "draft", data: DRAFT } },
      ],
    } as any);
  });

  it("401 jika tidak terautentikasi", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any);
    const res = await POST(makeReq({ message: "hi" }));
    expect(res.status).toBe(401);
  });

  it("surface pendingDrafts dari tool needs_approval", async () => {
    const res = await POST(makeReq({ message: "catat kopi 25rb dari BCA", model: "groq/llama-3.1-8b-instant" }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.pendingDrafts).toHaveLength(1);
    expect(data.pendingDrafts[0]).toMatchObject({ kind: "expense", accountId: "acc-1" });
  });

  it("rate-limit: panggilan ke-21 mengembalikan 429", async () => {
    // userId unik agar tidak terpengaruh kuota terpakai test lain (usageMap modul-level).
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "rl-user-quota" } } as any);
    const body = { message: "halo", model: "groq/llama-3.1-8b-instant" };
    for (let i = 0; i < 20; i++) {
      const ok = await POST(makeReq(body));
      expect(ok.status).toBe(200);
    }
    const blocked = await POST(makeReq(body));
    expect(blocked.status).toBe(429);
  });
});
