/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/expenses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { isSameMonth } from "@/lib/constant";
import { getExpenses, createExpense } from "@/lib/services/expenseService";

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

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const monthParam = searchParams.get("month");

  try {
    const expenses = await getExpenses({
      userId: session.user.id,
      category,
      startDate,
      endDate,
      monthParam,
    });
    return NextResponse.json(expenses);
  } catch (err: any) {
    console.error("Error fetching expenses:", err);
    if (err.message === "Invalid month format" || err.message === "Invalid month value") {
      return NextResponse.json({ error: "Format bulan tidak valid" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
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
          // Sanitize filename: strip path separators, replace unsafe chars
          const safeName = path.basename(photo.name).replace(/[^a-zA-Z0-9._-]/g, "_");
          const fileName = `${Date.now()}-${safeName}`;
          const filePath = path.join(uploadDir, fileName);
          // Ensure resolved path is within uploadDir (prevent traversal)
          if (!filePath.startsWith(path.resolve(uploadDir))) {
            throw new Error("Invalid filename");
          }
          fs.writeFileSync(filePath, buffer);
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

  try {
    const result = await createExpense({
      title,
      amount,
      category,
      description,
      date,
      accountId,
      userId: session.user.id,
      photoUrl,
      budgetId: validatedBudgetId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}