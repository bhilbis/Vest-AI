import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const goal = await prisma.savingsGoal.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!goal) return NextResponse.json({ error: "Tujuan tabungan tidak ditemukan" }, { status: 404 });

    const body = await req.json();
    const amount = Number(body.amount);
    const note = (body.note as string | null)?.trim() || null;
    const date = body.date ? new Date(body.date) : new Date();

    if (Number.isNaN(amount) || amount === 0) {
      return NextResponse.json({ error: "Jumlah kontribusi tidak valid" }, { status: 400 });
    }

    const [contribution, updated] = await prisma.$transaction([
      prisma.savingsContribution.create({
        data: { amount, note, date, savingsGoalId: goal.id },
      }),
      prisma.savingsGoal.update({
        where: { id: goal.id },
        data: { currentAmount: { increment: amount } },
      }),
    ]);

    return NextResponse.json({ contribution, goal: updated }, { status: 201 });
  } catch (error) {
    console.error("Savings contribute API error", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
