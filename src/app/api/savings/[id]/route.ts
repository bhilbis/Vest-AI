import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const withError = async <T>(fn: () => Promise<T>) => {
  try {
    return await fn();
  } catch (error) {
    console.error("Savings [id] API error", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
};

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  return withError(async () => {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!goal) return NextResponse.json({ error: "Tujuan tabungan tidak ditemukan" }, { status: 404 });

    const body = await req.json();
    const name = (body.name as string)?.trim();
    const targetAmount = Number(body.targetAmount);
    const currentAmount = Number(body.currentAmount ?? goal.currentAmount);
    const monthlyContribution = Number(body.monthlyContribution ?? goal.monthlyContribution);
    const deadline = body.deadline ? new Date(body.deadline) : null;
    const icon = (body.icon as string | null)?.trim() || null;
    const notes = (body.notes as string | null)?.trim() || null;

    if (!name || Number.isNaN(targetAmount) || targetAmount <= 0) {
      return NextResponse.json({ error: "Nama dan target tabungan wajib diisi" }, { status: 400 });
    }

    const updated = await prisma.savingsGoal.update({
      where: { id: goal.id },
      data: {
        name,
        targetAmount,
        currentAmount: Math.max(currentAmount, 0),
        monthlyContribution: Math.max(monthlyContribution, 0),
        deadline,
        icon,
        notes,
      },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  return withError(async () => {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!goal) return NextResponse.json({ error: "Tujuan tabungan tidak ditemukan" }, { status: 404 });

    await prisma.savingsGoal.delete({ where: { id: goal.id } });
    return NextResponse.json({ success: true });
  });
}
