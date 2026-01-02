/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { toMonthStart } from "@/lib/constant";

const getMonthRange = (monthStart: Date) => {
  const start = new Date(monthStart);
  const end = new Date(monthStart);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
};

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json([], { status: 200 });

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");

    let dateRange: { start: Date; end: Date } | null = null;
    try {
      const monthStart = toMonthStart(monthParam);
      dateRange = getMonthRange(monthStart);
    } catch (err) {
      console.error("Invalid month format in transfers API:", err);
      return NextResponse.json({ error: "Format bulan tidak valid" }, { status: 400 });
    }
  
    const transfers = await prisma.accountTransfer.findMany({
      where: {
        userId: session.user.id,
        ...(dateRange
          ? {
              date: {
                gte: dateRange.start,
                lt: dateRange.end,
              },
            }
          : {}),
      },
      orderBy: { date: "desc" },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });
  
    return NextResponse.json(transfers);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fromAccountId, toAccountId, amount, note } = await req.json();

    if (!fromAccountId || !toAccountId || !amount) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    if (fromAccountId === toAccountId) {
      return NextResponse.json({ error: "Akun tidak boleh sama" }, { status: 400 });
    }

    // Cek akun asal & tujuan
    const from = await prisma.accountBalance.findFirst({
      where: { id: fromAccountId, userId: session.user.id },
    });

    const to = await prisma.accountBalance.findFirst({
      where: { id: toAccountId, userId: session.user.id },
    });

    if (!from || !to) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }

    if (from.balance < amount) {
      return NextResponse.json(
        { error: "Saldo akun asal tidak mencukupi" },
        { status: 400 }
      );
    }

    // 🔥 Jalankan transfer dalam 1 Transaksi
    const result = await prisma.$transaction(async (tx: any) => {
      await tx.accountBalance.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } },
      });

      await tx.accountBalance.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } },
      });

      return await tx.accountTransfer.create({
        data: {
          userId: session.user.id,
          fromAccountId,
          toAccountId,
          amount,
          note,
        },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}