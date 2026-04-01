"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransferSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createTransfer(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const raw = {
    fromAccountId: formData.get("fromAccountId"),
    toAccountId: formData.get("toAccountId"),
    amount: formData.get("amount"),
    note: formData.get("note") || "",
  };

  const parsed = TransferSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  try {
    const { fromAccountId, toAccountId, amount, note } = parsed.data;

    const from = await prisma.accountBalance.findFirst({
      where: { id: fromAccountId, userId: session.user.id },
    });

    const to = await prisma.accountBalance.findFirst({
      where: { id: toAccountId, userId: session.user.id },
    });

    if (!from || !to) return { error: "Akun tidak ditemukan" };
    if (from.balance < amount) return { error: "Saldo akun asal tidak mencukupi" };

    await prisma.$transaction(async (tx) => {
      await tx.accountBalance.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } },
      });

      await tx.accountBalance.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } },
      });

      await tx.accountTransfer.create({
        data: {
          userId: session.user.id,
          fromAccountId,
          toAccountId,
          amount,
          note,
        },
      });
    });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("createTransfer error:", err);
    return { error: "Gagal melakukan transfer" };
  }
}
