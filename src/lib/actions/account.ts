"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountBalanceSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createAccount(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance") ?? 0,
  };

  const parsed = AccountBalanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  try {
    const { name, type, balance } = parsed.data;

    await prisma.accountBalance.create({
      data: {
        name,
        type,
        balance,
        userId: session.user.id,
      },
    });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("createAccount error:", err);
    return { error: "Gagal membuat akun" };
  }
}

/**
 * Update account with Adjustment Transaction.
 * When balance changes, the difference is recorded as an income (positive adj)
 * or expense (negative adj) so history stays accurate.
 */
export async function updateAccount(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const raw = {
    name: formData.get("name"),
    type: formData.get("type"),
    balance: formData.get("balance") ?? 0,
  };

  const parsed = AccountBalanceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  try {
    const { name, type, balance } = parsed.data;

    const existing = await prisma.accountBalance.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Akun tidak ditemukan" };

    const diff = balance - existing.balance;

    await prisma.$transaction(async (tx) => {
      // Update account
      await tx.accountBalance.update({
        where: { id },
        data: { name, type, balance },
      });

      // Record adjustment transaction if balance changed
      if (diff !== 0) {
        if (diff > 0) {
          // Positive adjustment → record as income
          await tx.income.create({
            data: {
              title: `Penyesuaian Saldo — ${name}`,
              amount: diff,
              date: new Date(),
              userId: session.user.id,
              accountId: id,
            },
          });
        } else {
          // Negative adjustment → record as expense
          await tx.expense.create({
            data: {
              title: `Penyesuaian Saldo — ${name}`,
              amount: Math.abs(diff),
              category: "adjustment",
              date: new Date(),
              userId: session.user.id,
              accountId: id,
            },
          });
        }
      }
    });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("updateAccount error:", err);
    return { error: "Gagal mengupdate akun" };
  }
}

export async function deleteAccount(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const existing = await prisma.accountBalance.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Akun tidak ditemukan" };

    await prisma.accountBalance.delete({ where: { id } });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("deleteAccount error:", err);
    return { error: "Gagal menghapus akun" };
  }
}
