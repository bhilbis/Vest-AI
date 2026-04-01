"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IncomeSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createIncome(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const raw = {
    title: formData.get("title"),
    amount: formData.get("amount"),
    date: formData.get("date"),
    accountId: formData.get("accountId"),
  };

  const parsed = IncomeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  try {
    const { title, amount, date, accountId } = parsed.data;

    await prisma.$transaction(async (tx) => {
      await tx.income.create({
        data: {
          title,
          amount,
          date: new Date(date),
          userId: session.user.id,
          accountId,
        },
      });

      await tx.accountBalance.update({
        where: { id: accountId },
        data: { balance: { increment: amount } },
      });
    });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("createIncome error:", err);
    return { error: "Gagal menyimpan pemasukan" };
  }
}

export async function deleteIncome(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const existing = await prisma.income.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Pemasukan tidak ditemukan" };

    await prisma.$transaction(async (tx) => {
      await tx.income.delete({ where: { id } });
      await tx.accountBalance.update({
        where: { id: existing.accountId },
        data: { balance: { decrement: existing.amount } },
      });
    });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("deleteIncome error:", err);
    return { error: "Gagal menghapus pemasukan" };
  }
}
