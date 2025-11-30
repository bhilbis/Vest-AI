// app/api/income/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(req: Request, { params }: any) {
  const session = await getServerSession(authOptions);
  const { id } = params;

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

export async function PUT(req: Request, { params }: any) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const income = await prisma.income.findUnique({ where: { id } });
  if (!income || income.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.json();
  const { title, amount, accountId, date } = form;

  const updatedAmount = amount;
  const updatedAccountId = accountId;

  // rollback saldo lama
  await prisma.accountBalance.update({
    where: { id: income.accountId },
    data: { balance: { decrement: income.amount } },
  });

  // update income
  const updated = await prisma.income.update({
    where: { id },
    data: {
      title,
      amount: updatedAmount,
      date: new Date(date),
      accountId: updatedAccountId,
    },
  });

  // tambah saldo baru
  await prisma.accountBalance.update({
    where: { id: updatedAccountId },
    data: { balance: { increment: updatedAmount } },
  });

  return NextResponse.json(updated);
}