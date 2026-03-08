import { prisma } from "@/lib/prisma";

type CreateIncomeParams = {
  title: string;
  amount: number;
  date: Date;
  userId: string;
  accountId: string;
};

export async function getIncomes(userId: string) {
  return prisma.income.findMany({
    where: { userId },
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
