import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const withError = async <T>(fn: () => Promise<T>) => {
  try {
    return await fn();
  } catch (error) {
    console.error("Savings API error", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
};

export async function GET() {
  return withError(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json([], { status: 401 });

    const goals = await prisma.savingsGoal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        targetAmount: true,
        currentAmount: true,
        monthlyContribution: true,
        deadline: true,
        icon: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(goals);
  });
}

export async function POST(req: Request) {
  return withError(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const name = (body.name as string)?.trim();
    const targetAmount = Number(body.targetAmount);
    const currentAmount = Number(body.currentAmount ?? 0);
    const monthlyContribution = Number(body.monthlyContribution ?? 0);
    const deadline = body.deadline ? new Date(body.deadline) : null;
    const icon = (body.icon as string | null)?.trim() || null;
    const notes = (body.notes as string | null)?.trim() || null;

    if (!name || Number.isNaN(targetAmount) || targetAmount <= 0) {
      return NextResponse.json({ error: "Nama dan target tabungan wajib diisi" }, { status: 400 });
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        name,
        targetAmount,
        currentAmount: Math.max(currentAmount, 0),
        monthlyContribution: Math.max(monthlyContribution, 0),
        deadline,
        icon,
        notes,
        userId: session.user.id,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  });
}
