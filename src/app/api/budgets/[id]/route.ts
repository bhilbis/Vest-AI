/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const toMonthStart = (input?: string | null, fallback?: Date) => {
  if (!input) return fallback ?? null;
  const isValid = /^\d{4}-\d{2}$/.test(input);
  if (!isValid) throw new Error("Invalid month format");
  const [year, month] = input.split("-").map(Number);
  if (!year || month < 1 || month > 12) throw new Error("Invalid month value");
  return new Date(Date.UTC(year, month - 1, 1));
};

const withErrorHandling = async <T>(fn: () => Promise<T>) => {
  try {
    return await fn();
  } catch (error) {
    console.error("Budget detail API error", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
};

export async function PUT(
  req: Request,
  id: any
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const budget = await prisma.budget.findFirst({
      where: { id: id, userId: session.user.id },
    });

    if (!budget) return NextResponse.json({ error: "Budget tidak ditemukan" }, { status: 404 });

    const body = await req.json();
    const name = (body.name as string)?.trim();
    const limit = Number(body.limit);
    const category = (body.category as string | null)?.trim() || null;
    const notes = (body.notes as string | null)?.trim() || null;

    if (!name || Number.isNaN(limit) || limit <= 0)
      return NextResponse.json(
        { error: "Nama dan limit budget wajib diisi" },
        { status: 400 }
      );

    let monthStart: Date | null = null;
    try {
      monthStart = toMonthStart(body.month as string | null, budget.month);
    } catch (error) {
      console.error("Error message: ",error)
      return NextResponse.json({ error: "Format bulan tidak valid" }, { status: 400 });
    }

    const updated = await prisma.budget.update({
      where: { id: budget.id },
      data: {
        name,
        category,
        limit,
        notes,
        month: monthStart ?? budget.month,
      },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(
  req: Request,
  id: any
) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const budget = await prisma.budget.findFirst({
      where: { id: id, userId: session.user.id },
    });

    if (!budget) return NextResponse.json({ error: "Budget tidak ditemukan" }, { status: 404 });

    // Lepaskan semua expense yang terhubung agar relasi aman
    await prisma.expense.updateMany({
      where: { budgetId: budget.id, userId: session.user.id },
      data: { budgetId: null },
    });

    await prisma.budget.delete({ where: { id: budget.id } });

    return NextResponse.json({ success: true });
  });
}
