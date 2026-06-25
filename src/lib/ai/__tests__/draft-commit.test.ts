/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { runTool, TOOL_REGISTRY } from "@/lib/ai/tools";
import { commitDraft } from "@/lib/ai/commit";
import { prisma } from "@/lib/prisma";
import { createExpense } from "@/lib/services/expenseService";
import { createIncome } from "@/lib/services/incomeService";

vi.mock("@/lib/prisma", () => ({
  prisma: { accountBalance: { findMany: vi.fn() } },
}));
vi.mock("@/lib/services/expenseService");
vi.mock("@/lib/services/incomeService");

const CTX = { userId: "user-1" };
const ACCOUNTS = [{ id: "acc-bca", name: "BCA", balance: 100_000 }];

describe("draft tools (propose only, no write)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.accountBalance.findMany).mockResolvedValue(ACCOUNTS as any);
  });

  it("draft_expense resolves account by name and returns needs_approval", async () => {
    const res = await runTool(
      "draft_expense",
      { title: "Kopi", amount: 25000, account: "bca" },
      CTX,
    );
    expect(res.status).toBe("needs_approval");
    expect(res.data).toMatchObject({
      kind: "expense",
      accountId: "acc-bca",
      accountName: "BCA",
      sufficientBalance: true,
    });
    // tidak ada penulisan ke DB pada tahap draft
    expect(createExpense).not.toHaveBeenCalled();
  });

  it("draft_expense flags insufficient balance but still drafts", async () => {
    const res = await runTool(
      "draft_expense",
      { title: "Laptop", amount: 9_000_000, account: "BCA" },
      CTX,
    );
    expect(res.status).toBe("needs_approval");
    expect((res.data as any).sufficientBalance).toBe(false);
  });

  it("draft_expense errors on unknown account and lists available", async () => {
    const res = await runTool(
      "draft_expense",
      { title: "x", amount: 1000, account: "Mandiri" },
      CTX,
    );
    expect(res.status).toBe("error");
    expect(res.summary).toContain("BCA");
  });
});

describe("approval bypass is structurally impossible", () => {
  it("commit tools are NOT in the registry exposed to the model", () => {
    const names = TOOL_REGISTRY.map((t) => t.name);
    expect(names).not.toContain("commit_expense");
    expect(names).not.toContain("commit_income");
  });

  it("runTool refuses commit_* as unknown tool", async () => {
    const res = await runTool("commit_expense", { amount: 1 }, CTX);
    expect(res.status).toBe("error");
    expect(res.summary).toContain("tidak dikenal");
  });
});

describe("commitDraft (server-only, approval-gated)", () => {
  beforeEach(() => vi.clearAllMocks());

  const validExpense = {
    title: "Kopi",
    amount: 25000,
    category: "Makanan",
    accountId: "acc-bca",
    date: "2026-06-23",
  };

  it("commits a valid expense via createExpense", async () => {
    vi.mocked(createExpense).mockResolvedValue({
      id: "exp-1",
      title: "Kopi",
      amount: 25000,
      account: { name: "BCA" },
    } as any);

    const res = await commitDraft("expense", validExpense, "user-1");
    expect(createExpense).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: "acc-bca", userId: "user-1", amount: 25000 }),
    );
    expect(res.status).toBe("ok");
    expect(res.ref).toBe("exp-1");
  });

  it("surfaces 'Saldo tidak mencukupi' from the $transaction guard", async () => {
    vi.mocked(createExpense).mockRejectedValue(new Error("Saldo tidak mencukupi"));
    const res = await commitDraft("expense", validExpense, "user-1");
    expect(res.status).toBe("error");
    expect(res.summary).toBe("Saldo tidak mencukupi");
  });

  it("rejects invalid draft (missing accountId) via zod before any write", async () => {
    const res = await commitDraft("expense", { ...validExpense, accountId: "" }, "user-1");
    expect(res.status).toBe("error");
    expect(createExpense).not.toHaveBeenCalled();
  });

  it("commits a valid income via createIncome", async () => {
    vi.mocked(createIncome).mockResolvedValue({
      id: "inc-1",
      title: "Gaji",
      amount: 5_000_000,
      account: { name: "BCA" },
    } as any);
    const res = await commitDraft(
      "income",
      { title: "Gaji", amount: 5_000_000, accountId: "acc-bca", date: "2026-06-23" },
      "user-1",
    );
    expect(res.status).toBe("ok");
    expect(res.ref).toBe("inc-1");
  });
});
