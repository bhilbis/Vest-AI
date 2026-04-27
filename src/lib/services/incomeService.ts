import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type CreateIncomeParams = {
  title: string;
  amount: number;
  date: Date;
  userId: string;
  accountId: string;
};

type GetIncomesParams = {
  userId: string;
  monthParam?: string | null;
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

export async function getIncomes({ userId, monthParam }: GetIncomesParams) {
  const where: Prisma.IncomeWhereInput = { userId };

  if (monthParam) {
    const { monthStart, monthEndExclusive } = parseMonthRange(monthParam);
    where.date = {
      gte: monthStart,
      lt: monthEndExclusive,
    };
  }

  return prisma.income.findMany({
    where,
    include: {
      account: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function createIncome({
  title,
  amount,
  date,
  userId,
  accountId,
}: CreateIncomeParams) {
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
        balance: { increment: amount },
      },
    });

    return tx.income.create({
      data: {
        title: title.trim(),
        amount,
        date,
        userId,
        accountId,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  });
}
