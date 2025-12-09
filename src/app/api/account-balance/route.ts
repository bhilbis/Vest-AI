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

  // Optimize: Parallelize cash check and accounts fetch
  // Since we need to check cash anyway, we can fetch all accounts and check in parallel
  const [cash, allAccounts] = await Promise.all([
    prisma.accountBalance.findFirst({
      where: { userId, type: "cash" },
    }),
    prisma.accountBalance.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Jika belum ada cash → buat otomatis
  if (!cash) {
    // Create cash and immediately include it in response
    const newCash = await prisma.accountBalance.create({
      data: {
        name: "Cash",
        type: "cash",
        balance: 0,
        userId,
      },
    });

    // Return all accounts + newly created cash, sorted by createdAt
    return Response.json(
      [...allAccounts, newCash].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )
    );
  }

  // Cash exists, return all accounts
  return Response.json(allAccounts);
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