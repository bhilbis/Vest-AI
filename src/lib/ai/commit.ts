import { z } from "zod";
import { ExpenseSchema, IncomeSchema, TransferSchema } from "@/lib/validations";
import { createExpense } from "@/lib/services/expenseService";
import { createIncome } from "@/lib/services/incomeService";
import { prisma } from "@/lib/prisma";
import type { ToolResult } from "./tools";

/**
 * Commit draft pengeluaran/pemasukan/transfer. INI BUKAN tool yang diekspos ke model —
 * hanya dipanggil oleh endpoint commit yang di-trigger approval user eksplisit
 * (blueprint §12). Validasi memakai schema yang sama dengan form (reuse), dan
 * guard saldo/userId ditegakkan di kode service ($transaction), bukan di prompt.
 */

export type CommitKind = "expense" | "income" | "transfer";

function zodMessage(err: z.ZodError): string {
  return err.issues.map((i) => i.message).join("; ");
}

export async function commitDraft(
  kind: CommitKind,
  draft: unknown,
  userId: string,
): Promise<ToolResult> {
  try {
    if (kind === "expense") {
      const parsed = ExpenseSchema.parse(draft);
      const created = await createExpense({
        title: parsed.title,
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description || null,
        date: new Date(parsed.date),
        accountId: parsed.accountId,
        userId,
        budgetId: parsed.budgetId || null,
      });
      return {
        status: "ok",
        summary: `Pengeluaran "${created.title}" sebesar ${created.amount} tercatat dari ${created.account?.name ?? "akun"}.`,
        ref: created.id,
        data: created,
      };
    }

    if (kind === "transfer") {
      // Semantik sama dengan src/lib/actions/transfer.ts: kepemilikan kedua akun
      // diverifikasi, saldo dicek, lalu mutasi saldo + pencatatan dalam satu transaksi.
      const parsed = TransferSchema.parse(draft);
      const [from, to] = await Promise.all([
        prisma.accountBalance.findFirst({ where: { id: parsed.fromAccountId, userId } }),
        prisma.accountBalance.findFirst({ where: { id: parsed.toAccountId, userId } }),
      ]);
      if (!from || !to) {
        return { status: "error", summary: "Akun tidak ditemukan" };
      }
      if (from.balance < parsed.amount) {
        return { status: "error", summary: "Saldo akun asal tidak mencukupi" };
      }
      const created = await prisma.$transaction(async (tx) => {
        await tx.accountBalance.update({
          where: { id: parsed.fromAccountId },
          data: { balance: { decrement: parsed.amount } },
        });
        await tx.accountBalance.update({
          where: { id: parsed.toAccountId },
          data: { balance: { increment: parsed.amount } },
        });
        return tx.accountTransfer.create({
          data: {
            userId,
            fromAccountId: parsed.fromAccountId,
            toAccountId: parsed.toAccountId,
            amount: parsed.amount,
            note: parsed.note,
          },
        });
      });
      return {
        status: "ok",
        summary: `Transfer ${created.amount} dari ${from.name} ke ${to.name} tercatat.`,
        ref: created.id,
        data: created,
      };
    }

    const parsed = IncomeSchema.parse(draft);
    const created = await createIncome({
      title: parsed.title,
      amount: parsed.amount,
      date: new Date(parsed.date),
      accountId: parsed.accountId,
      userId,
    });
    return {
      status: "ok",
      summary: `Pemasukan "${created.title}" sebesar ${created.amount} tercatat ke ${created.account?.name ?? "akun"}.`,
      ref: created.id,
      data: created,
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { status: "error", summary: `Draft tidak valid: ${zodMessage(err)}` };
    }
    // Guard kode: "Saldo tidak mencukupi", "Account not found", dll.
    const message = err instanceof Error ? err.message : "Gagal mencatat transaksi";
    return { status: "error", summary: message };
  }
}
