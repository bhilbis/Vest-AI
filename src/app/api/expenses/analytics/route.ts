import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { toMonthStart } from "@/lib/constant";

const monthKey = (date: Date) => date.toISOString().slice(0, 7);
const dayKey = (date: Date) => date.toISOString().slice(0, 10);

const weekKey = (date: Date) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  return start.toISOString().slice(0, 10);
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  let selectedMonth: Date;
  try {
    selectedMonth = toMonthStart(searchParams.get("month"));
  } catch {
    return NextResponse.json({ error: "Format bulan tidak valid" }, { status: 400 });
  }

  const currentStart = new Date(selectedMonth);
  const currentEnd = new Date(selectedMonth);
  currentEnd.setUTCMonth(currentEnd.getUTCMonth() + 1);

  const previousStart = new Date(selectedMonth);
  previousStart.setUTCMonth(previousStart.getUTCMonth() - 1);

  const comparisonStart = new Date(selectedMonth);
  comparisonStart.setUTCMonth(comparisonStart.getUTCMonth() - 5);

  const items = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      date: { gte: comparisonStart, lt: currentEnd },
    },
    orderBy: [{ date: "desc" }, { amount: "desc" }],
    include: { account: { select: { name: true } } },
  });

  const monthlyMap = new Map<string, number>();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(selectedMonth);
    date.setUTCMonth(date.getUTCMonth() - i);
    monthlyMap.set(monthKey(date), 0);
  }

  const dailyMap = new Map<string, number>();
  const weeklyMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  let currentTotal = 0;
  let previousTotal = 0;

  items.forEach((item) => {
    const date = item.date;
    const key = monthKey(date);
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + item.amount);

    if (date >= currentStart && date < currentEnd) {
      currentTotal += item.amount;
      dailyMap.set(dayKey(date), (dailyMap.get(dayKey(date)) ?? 0) + item.amount);
      weeklyMap.set(weekKey(date), (weeklyMap.get(weekKey(date)) ?? 0) + item.amount);
      const category = item.category || "other";
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + item.amount);
    } else if (date >= previousStart && date < currentStart) {
      previousTotal += item.amount;
    }
  });

  const topExpenses = items
    .filter((item) => item.date >= currentStart && item.date < currentEnd)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.title,
      amount: item.amount,
      category: item.category,
      date: item.date,
      accountName: item.account?.name ?? null,
    }));

  const monthlyComparison = Array.from(monthlyMap.entries()).map(([month, total], index, rows) => {
    const previous = index > 0 ? rows[index - 1][1] : 0;
    const change = total - previous;
    const changePct = previous > 0 ? (change / previous) * 100 : null;
    return { month, total, change, changePct };
  });

  return NextResponse.json({
    currentTotal,
    previousTotal,
    change: currentTotal - previousTotal,
    changePct: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : null,
    monthlyComparison,
    daily: Array.from(dailyMap.entries()).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date)),
    weekly: Array.from(weeklyMap.entries()).map(([weekStart, total]) => ({ weekStart, total })).sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    categories: Array.from(categoryMap.entries()).map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total),
    topExpenses,
  });
}
