// app/api/expenses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

const isSameMonth = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: any = {
    userId: session.user.id,
  };

  if (category) where.category = category;
  if (startDate) where.date = { gte: new Date(startDate) };
  if (endDate) {
    where.date = {
      ...(where.date ?? {}),
      lte: new Date(endDate + "T23:59:59"),
    };
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      budget: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const category = (formData.get("category") as string) || null;
  const description = (formData.get("description") as string) || null;
  const date = new Date(formData.get("date") as string);
  const accountId = formData.get("accountId") as string;
  const photo = formData.get("photo") as File | null;
  const budgetField = formData.get("budgetId");
  const budgetId = typeof budgetField === "string" && budgetField.trim() !== ""
    ? budgetField
    : null;

  if (!accountId) return NextResponse.json({ error: "Account required" }, { status: 400 });

  let validatedBudgetId: string | null = null;
  if (budgetId) {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId: session.user.id },
    });

    if (!budget)
      return NextResponse.json({ error: "Budget tidak ditemukan" }, { status: 404 });

    if (!isSameMonth(date, budget.month)) {
      return NextResponse.json(
        { error: "Tanggal pengeluaran harus berada di bulan yang sama dengan budget" },
        { status: 400 }
      );
    }

    validatedBudgetId = budget.id;
  }

  let photoUrl: string | null = null;

  // upload foto
  if (photo) {
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public/uploads/expenses");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${photo.name}`;
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);
    photoUrl = `/uploads/expenses/${fileName}`;
  }

  // simpan expense
  const expense = await prisma.expense.create({
    data: {
      title,
      amount,
      category,
      description,
      accountId,
      date,
      userId: session.user.id,
      photoUrl,
      budgetId: validatedBudgetId,
    },
  });

  // kurangi saldo account
  await prisma.accountBalance.update({
    where: { id: accountId },
    data: { balance: { decrement: amount } },
  });

  return NextResponse.json(expense);
}