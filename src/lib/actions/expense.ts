"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ExpenseSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createExpense(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const raw = {
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    description: formData.get("description") || "",
    date: formData.get("date"),
    accountId: formData.get("accountId"),
    budgetId: formData.get("budgetId") || "",
  };

  const parsed = ExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  try {
    const { title, amount, category, description, date, accountId, budgetId } = parsed.data;

    await prisma.$transaction(async (tx) => {
      await tx.expense.create({
        data: {
          title,
          amount,
          category,
          description,
          date: new Date(date),
          userId: session.user.id,
          accountId,
          budgetId: budgetId || null,
        },
      });

      await tx.accountBalance.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });
    });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("createExpense error:", err);
    return { error: "Gagal menyimpan pengeluaran" };
  }
}

export async function updateExpense(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const raw = {
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    description: formData.get("description") || "",
    date: formData.get("date"),
    accountId: formData.get("accountId"),
    budgetId: formData.get("budgetId") || "",
  };

  const parsed = ExpenseSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  try {
    const { title, amount, category, description, date, accountId, budgetId } = parsed.data;

    const existing = await prisma.expense.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Pengeluaran tidak ditemukan" };

    await prisma.$transaction(async (tx) => {
      // Restore old amount to old account
      await tx.accountBalance.update({
        where: { id: existing.accountId },
        data: { balance: { increment: existing.amount } },
      });

      // Update expense
      await tx.expense.update({
        where: { id },
        data: {
          title,
          amount,
          category,
          description,
          date: new Date(date),
          accountId,
          budgetId: budgetId || null,
        },
      });

      // Deduct new amount from new account
      await tx.accountBalance.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });
    });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("updateExpense error:", err);
    return { error: "Gagal mengupdate pengeluaran" };
  }
}

export async function deleteExpense(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const existing = await prisma.expense.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Pengeluaran tidak ditemukan" };

    await prisma.$transaction(async (tx) => {
      await tx.expense.delete({ where: { id } });
      await tx.accountBalance.update({
        where: { id: existing.accountId },
        data: { balance: { increment: existing.amount } },
      });
    });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("deleteExpense error:", err);
    return { error: "Gagal menghapus pengeluaran" };
  }
}
