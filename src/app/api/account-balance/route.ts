// app/api/account-balance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;

  // Cek apakah sudah ada CASH
  let cash = await prisma.accountBalance.findFirst({
    where: { userId, type: "cash" },
  });

  // Jika belum ada → buat otomatis
  if (!cash) {
    cash = await prisma.accountBalance.create({
      data: {
        name: "Cash",
        type: "cash",
        balance: 0,
        userId,
      },
    });
  }

  // Ambil semua account termasuk cash
  const accounts = await prisma.accountBalance.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(accounts);
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

  if (type === "cash") {
    const existingCash = await prisma.accountBalance.findFirst({
      where: { userId: session?.user?.id, type: "cash" }
    });
  
    if (existingCash) {
      return new Response(
        JSON.stringify({ error: "Akun cash sudah ada. Tidak boleh lebih dari 1." }),
        { status: 400 }
      );
    }
  }

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