/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { runTool, toOpenAISchema, toGeminiSchema } from "@/lib/ai/tools";
import { getExpenses } from "@/lib/services/expenseService";
import { getFinancialSummary } from "@/lib/services/financeSummary";

vi.mock("@/lib/services/expenseService");
vi.mock("@/lib/services/financeSummary");

const CTX = { userId: "user-1" };

describe("tool registry runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for unknown tool", async () => {
    const res = await runTool("delete_everything", {}, CTX);
    expect(res.status).toBe("error");
    expect(res.summary).toContain("tidak dikenal");
  });

  describe("get_financial_summary", () => {
    it("returns ok with summary data scoped to userId", async () => {
      vi.mocked(getFinancialSummary).mockResolvedValue({
        netCashFlow: "Rp100.000",
        totalBalance: "Rp1.000.000",
      } as any);

      const res = await runTool("get_financial_summary", {}, CTX);

      expect(getFinancialSummary).toHaveBeenCalledWith("user-1");
      expect(res.status).toBe("ok");
      expect(res.data).toMatchObject({ totalBalance: "Rp1.000.000" });
    });
  });

  describe("list_expenses", () => {
    it("scopes to userId and caps at 20 rows", async () => {
      const rows = Array.from({ length: 30 }, (_, i) => ({
        id: String(i),
        title: `e${i}`,
        amount: 1000,
        category: "Makanan",
        date: new Date("2026-06-01"),
        account: { name: "BCA" },
        budget: null,
      }));
      vi.mocked(getExpenses).mockResolvedValue(rows as any);

      const res = await runTool("list_expenses", { category: "Makanan" }, CTX);

      expect(getExpenses).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "user-1", category: "Makanan" }),
      );
      expect(res.status).toBe("ok");
      expect((res.data as unknown[]).length).toBe(20);
    });

    it("rejects invalid month format via zod", async () => {
      const res = await runTool("list_expenses", { month: "June" }, CTX);
      expect(res.status).toBe("error");
      expect(getExpenses).not.toHaveBeenCalled();
    });
  });
});

describe("schema converters", () => {
  const params = {
    category: { type: "string" as const, description: "cat" },
    amount: { type: "number" as const, description: "amt", required: true },
  };

  it("OpenAI schema uses lowercase types and collects required", () => {
    const schema = toOpenAISchema(params);
    expect(schema.type).toBe("object");
    expect(schema.properties.category.type).toBe("string");
    expect(schema.required).toEqual(["amount"]);
  });

  it("Gemini schema uses UPPERCASE types", () => {
    const schema = toGeminiSchema(params);
    expect(schema.type).toBe("OBJECT");
    expect(schema.properties.amount.type).toBe("NUMBER");
    expect(schema.required).toEqual(["amount"]);
  });
});
