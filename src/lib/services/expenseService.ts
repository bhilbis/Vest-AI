import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type GetExpensesParams = {
  userId: string;
  category?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  monthParam?: string | null;
};

type CreateExpenseParams = {
  title: string;
  amount: number;
  category?: string | null;
  description?: string | null;
  date: Date;
  accountId: string;
  userId: string;
  photoUrl?: string | null;
  budgetId?: string | null;
};

function parseMonthRange(monthParam: string) {
  if (!/^\d{4}-\d{2}$/.test(monthParam)) {
    throw new Error("Invalid month format");
  }

  const [yearStr, monthStr] = monthParam.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month value");
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEndExclusive = new Date(Date.UTC(year, month, 1));
  return { monthStart, monthEndExclusive };
}

function parseDateString(value: string, label: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label}`);
  }
  return parsed;
}

export async function getExpenses({
  userId,
  category,
  startDate,
  endDate,
  monthParam,
}: GetExpensesParams) {
  const where: Prisma.ExpenseWhereInput = { userId };
  const andClauses: Prisma.ExpenseWhereInput[] = [];

  if (category && category !== "all") {
    where.category = category;
  }

  if (monthParam) {
    const { monthStart, monthEndExclusive } = parseMonthRange(monthParam);
    andClauses.push({
      date: {
        gte: monthStart,
        lt: monthEndExclusive,
      },
    });
  }

  if (startDate) {
    andClauses.push({
      date: { gte: parseDateString(startDate, "startDate") },
    });
  }

  if (endDate) {
    andClauses.push({
      date: { lte: parseDateString(endDate, "endDate") },
    });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  return prisma.expense.findMany({
    where,
    include: {
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      budget: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function createExpense({
  title,
  amount,
  category,
  description,
  date,
  accountId,
  userId,
  photoUrl,
  budgetId,
}: CreateExpenseParams) {
  if (!title?.trim()) {
    throw new Error("Invalid title");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return prisma.$transaction(async (tx) => {
    const account = await tx.accountBalance.findFirst({
      where: { id: accountId, userId },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    await tx.accountBalance.update({
      where: { id: accountId },
      data: {
        balance: { decrement: amount },
      },
    });

    return tx.expense.create({
      data: {
        title: title.trim(),
        amount,
        category,
        description,
        date,
        accountId,
        userId,
        photoUrl,
        budgetId,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        budget: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  });
}
