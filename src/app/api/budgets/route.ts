import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const toMonthStart = (input?: string | null) => {
  if (!input) {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  const isValid = /^\d{4}-\d{2}$/.test(input);
  if (!isValid) throw new Error("Invalid month format");

  const [year, month] = input.split("-").map(Number);
  if (!year || month < 1 || month > 12) throw new Error("Invalid month value");

  return new Date(Date.UTC(year, month - 1, 1));
};

const getMonthRange = (monthStart: Date) => {
  const start = new Date(monthStart);
  const end = new Date(monthStart);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
};

const formatMonthParam = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const withErrorHandling = async <T>(fn: () => Promise<T>) => {
  try {
    return await fn();
  } catch (error) {
    console.error("Budget API error", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
};

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json([], { status: 401 });

    const { searchParams } = new URL(req.url);
    let monthStart: Date;

    try {
      monthStart = toMonthStart(searchParams.get("month"));
    } catch (error) {
      return NextResponse.json({ error: "Format bulan tidak valid" }, { status: 400 });
    }

    const { start, end } = getMonthRange(monthStart);

    const [budgets, spending] = await Promise.all([
      prisma.budget.findMany({
        where: { userId: session.user.id, month: start },
        orderBy: { createdAt: "asc" },
      }),
      prisma.expense.groupBy({
        by: ["budgetId"],
        where: {
          userId: session.user.id,
          budgetId: { not: null },
          date: { gte: start, lt: end },
        },
        _sum: { amount: true },
      }),
    ]);

    const spentMap = new Map(
      spending
        .filter((item) => item.budgetId)
        .map((item) => [item.budgetId as string, item._sum.amount ?? 0])
    );

    const payload = budgets.map((budget) => {
      const spent = spentMap.get(budget.id) ?? 0;
      return {
        ...budget,
        spent,
        remaining: Math.max(budget.limit - spent, 0),
        monthKey: formatMonthParam(budget.month),
      };
    });

    return NextResponse.json({ month: formatMonthParam(start), budgets: payload });
  });
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name = (body.name as string)?.trim();
    const limit = Number(body.limit);
    const category = (body.category as string | null)?.trim() || null;
    const notes = (body.notes as string | null)?.trim() || null;

    if (!name || Number.isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        { error: "Nama dan limit budget wajib diisi" },
        { status: 400 }
      );
    }

    let monthStart: Date;
    try {
      monthStart = toMonthStart(body.month as string | null);
    } catch (error) {
      return NextResponse.json({ error: "Format bulan tidak valid" }, { status: 400 });
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        category,
        limit,
        notes,
        month: monthStart,
        userId: session.user.id,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  });
}
