/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/expenses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

/*
 * SUGGESTED PRISMA SCHEMA INDEXES FOR OPTIMAL PERFORMANCE:
 * 
 * model Expense {
 *   // Existing indexes are good, but consider adding:
 *   @@index([userId, category])  // For filtering by category per user
 *   @@index([userId, date, category])  // Composite for date + category filters
 *   // Current: @@index([userId, date]) and @@index([budgetId]) - keep these
 * }
 * 
 * model Asset {
 *   @@index([userId, type])  // For filtering assets by type
 *   @@index([userId, createdAt])  // For ordering by creation date
 *   // No indexes currently exist - these would help
 * }
 * 
 * model AccountBalance {
 *   // Current: @@index([userId, name, type]) - good, keep it
 * }
 * 
 * model Budget {
 *   // Current: @@index([userId, month, name]) - good, keep it
 * }
 */

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

  // Optimize: Select only fields actually used by frontend
  // Frontend uses: id, title, amount, category, description, photoUrl, date, createdAt, accountId, budgetId
  // Plus budget relation: id, name
  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    select: {
      id: true,
      title: true,
      amount: true,
      category: true,
      description: true,
      photoUrl: true,
      date: true,
      createdAt: true,
      accountId: true,
      budgetId: true,
      budget: {
        select: {
          id: true,
          name: true,
        },
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

  // Optimize: Parallelize budget validation and photo upload (they don't depend on each other)
  let validatedBudgetId: string | null = null;
  let photoUrl: string | null = null;

  const [budgetValidation, photoUpload] = await Promise.all([
    // Budget validation
    budgetId
      ? prisma.budget.findFirst({
          where: { id: budgetId, userId: session.user.id },
          select: { id: true, month: true }, // Only select fields needed for validation
        })
      : Promise.resolve(null),
    // Photo upload (process in parallel)
    photo
      ? (async () => {
          const bytes = await photo.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const uploadDir = path.join(process.cwd(), "public/uploads/expenses");
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          const fileName = `${Date.now()}-${photo.name}`;
          fs.writeFileSync(path.join(uploadDir, fileName), buffer);
          return `/uploads/expenses/${fileName}`;
        })()
      : Promise.resolve(null),
  ]);

  // Validate budget if provided
  if (budgetId) {
    if (!budgetValidation) {
      return NextResponse.json({ error: "Budget tidak ditemukan" }, { status: 404 });
    }

    if (!isSameMonth(date, budgetValidation.month)) {
      return NextResponse.json(
        { error: "Tanggal pengeluaran harus berada di bulan yang sama dengan budget" },
        { status: 400 }
      );
    }

    validatedBudgetId = budgetValidation.id;
  }

  photoUrl = photoUpload;

  // Optimize: Use transaction to ensure data consistency
  // Create expense and update account balance atomically
  const result = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
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
      select: {
        id: true,
        title: true,
        amount: true,
        category: true,
        description: true,
        photoUrl: true,
        date: true,
        createdAt: true,
        accountId: true,
        budgetId: true,
      },
    });

    // Update account balance
    await tx.accountBalance.update({
      where: { id: accountId },
      data: { balance: { decrement: amount } },
    });

    return expense;
  });

  return NextResponse.json(result);
}