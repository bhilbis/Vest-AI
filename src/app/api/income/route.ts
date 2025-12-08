// app/api/income/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const incomes = await prisma.income.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: { account: true },
  });

  return NextResponse.json(incomes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.json();
  const { title, amount, date, accountId } = form;

  if (!title || !amount || !accountId) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // ✨ Buat income record
  const income = await prisma.income.create({
    data: {
      title,
      amount,
      date: new Date(date),
      userId: session.user.id,
      accountId,
    },
  });

  // ✨ Tambah saldo
  await prisma.accountBalance.update({
    where: { id: accountId },
    data: {
      balance: { increment: amount },
    },
  });

  return NextResponse.json(income);
}