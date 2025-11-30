// app/api/account-balance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const accounts = await prisma.accountBalance.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      type: true,
      balance: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Limit results to prevent unbounded queries
  });

  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, balance } = await req.json();

  if (!name || !type)
    return NextResponse.json(
      { error: "Nama dan tipe wajib diisi" },
      { status: 400 }
    );

  const account = await prisma.accountBalance.create({
    data: {
      name,
      type,
      balance: balance ?? 0,
      userId: session.user.id,
    },
  });

  return NextResponse.json(account);
}