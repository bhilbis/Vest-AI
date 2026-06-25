import { prisma } from "@/lib/prisma";

/**
 * Ringkasan finansial agregat untuk konteks AI & tool `get_financial_summary`.
 * Diekstrak dari ai-context-chat agar route dan tool memakai sumber yang sama
 * (lihat docs/financial-assistant-agent-blueprint.md §5 & §6).
 */

export const limitNumber = (value: number, decimals = 2) =>
  Number.isFinite(value) ? Number(value.toFixed(decimals)) : 0;

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export type BudgetUtilization = {
  name: string;
  category: string | null;
  limit: number;
  spent: number;
  remaining: number;
  utilizationPct: number;
  month: string;
};

export type FinancialSummary = {
  totalBalance: string;
  totalBalanceRaw: number;
  expenseRecentTotal: string;
  expenseRecentRaw: number;
  incomeRecentTotal: string;
  incomeRecentRaw: number;
  netCashFlow: string;
  netCashFlowRaw: number;
  financialRunwayMonths: number | null;
  expenseByCategory: Record<string, number>;
  budgetUtilization: BudgetUtilization[];
};

export async function getFinancialSummary(userId: string): Promise<FinancialSummary> {
  const [balances, expenses, incomes, budgets] = await Promise.all([
    prisma.accountBalance.findMany({
      where: { userId },
      select: { balance: true },
    }),
    prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 20,
      select: { amount: true, category: true, budgetId: true },
    }),
    prisma.income.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 10,
      select: { amount: true },
    }),
    prisma.budget.findMany({
      where: { userId },
      orderBy: { month: "desc" },
      take: 6,
      select: { id: true, name: true, category: true, limit: true, month: true },
    }),
  ]);

  const totalBalance = balances.reduce((sum, b) => sum + (b.balance ?? 0), 0);
  const expenseMonth = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const incomeMonth = incomes.reduce((sum, i) => sum + (i.amount ?? 0), 0);
  const netCashFlow = incomeMonth - expenseMonth;

  const expenseByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category || "Lainnya";
    acc[cat] = (acc[cat] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {});

  const budgetUtilization: BudgetUtilization[] = budgets.map((b) => {
    const spent = expenses
      .filter((e) => e.budgetId === b.id)
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
    return {
      name: b.name,
      category: b.category,
      limit: b.limit,
      spent,
      remaining: (b.limit ?? 0) - spent,
      utilizationPct: b.limit ? limitNumber((spent / b.limit) * 100) : 0,
      month: b.month.toISOString().slice(0, 7),
    };
  });

  // Runway: berapa bulan saldo bertahan pada burn rate saat ini (hanya saat defisit).
  const financialRunwayMonths =
    netCashFlow < 0 && totalBalance > 0
      ? limitNumber(totalBalance / Math.abs(netCashFlow))
      : null;

  return {
    totalBalance: formatCurrency(totalBalance),
    totalBalanceRaw: totalBalance,
    expenseRecentTotal: formatCurrency(expenseMonth),
    expenseRecentRaw: expenseMonth,
    incomeRecentTotal: formatCurrency(incomeMonth),
    incomeRecentRaw: incomeMonth,
    netCashFlow: formatCurrency(netCashFlow),
    netCashFlowRaw: netCashFlow,
    financialRunwayMonths,
    expenseByCategory,
    budgetUtilization,
  };
}
