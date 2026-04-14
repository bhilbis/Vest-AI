/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/income/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request, 
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const id = params.id;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const income = await prisma.income.findUnique({ where: { id } });
  if (!income || income.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // balikan saldo
  await prisma.accountBalance.update({
    where: { id: income.accountId },
    data: { balance: { decrement: income.amount } },
  });

  await prisma.income.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PUT(
  req: Request, 
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const id = params.id;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const income = await prisma.income.findUnique({ where: { id } });
  if (!income || income.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.json();
  const { title, amount, accountId, date } = form;

  if (!title || !amount || !accountId) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const updated = await prisma.$transaction(async (tx: any) => {
      // rollback saldo lama
      await tx.accountBalance.update({
        where: { id: income.accountId },
        data: { balance: { decrement: income.amount } },
      });

      // update income
      const result = await tx.income.update({
        where: { id },
        data: {
          title,
          amount,
          date: new Date(date),
          accountId,
        },
      });

      // tambah saldo baru
      await tx.accountBalance.update({
        where: { id: accountId },
        data: { balance: { increment: amount } },
      });

      return result;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating income:", error);
    return NextResponse.json({ error: "Failed to update income" }, { status: 500 });
  }
}