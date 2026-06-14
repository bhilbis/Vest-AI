/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/account-balance/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// interface BalanceProps {
//   id?: any;
//   name?: string;
//   type?: any;
//   balance?: any;
// }

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const id = params.id;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, balance } = await req.json();

  if (!name || !type)
    return NextResponse.json(
      { error: "Nama dan jenis wajib diisi" },
      { status: 400 }
    );

  // check ownership
  const existing = await prisma.accountBalance.findFirst({
    where: { id, userId: session.user.id }
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.accountBalance.update({
    where: {
      id: id,
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
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const id = params.id;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // verify ownership
  const existing = await prisma.accountBalance.findFirst({
    where: { id, userId: session.user.id }
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Hapus transfer terkait (expense/income tetap ada, accountId akan di-null otomatis via onDelete: SetNull)
  await prisma.$transaction(async (tx: any) => {
    await tx.accountTransfer.deleteMany({
      where: { OR: [{ fromAccountId: id }, { toAccountId: id }] },
    });
    await tx.accountBalance.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}