// app/api/account-balance/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, balance } = await req.json();

  if (!name || !type)
    return NextResponse.json(
      { error: "Nama dan jenis wajib diisi" },
      { status: 400 }
    );

  const updated = await prisma.accountBalance.update({
    where: {
      id: params.id,
    },
    data: {
      name,
      type,
      balance,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Cek apakah dipakai income / expense
  const used = await prisma.expense.findFirst({
    where: { accountId: params.id },
  });

  if (used)
    return NextResponse.json(
      {
        error:
          "Akun ini masih dipakai pada transaksi pengeluaran. Tidak bisa dihapus.",
      },
      { status: 400 }
    );

  const usedIncome = await prisma.income.findFirst({
    where: { accountId: params.id },
  });

  if (usedIncome)
    return NextResponse.json(
      {
        error:
          "Akun ini masih dipakai pada transaksi pemasukan. Tidak bisa dihapus.",
      },
      { status: 400 }
    );

  // Bisa dihapus
  await prisma.accountBalance.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}