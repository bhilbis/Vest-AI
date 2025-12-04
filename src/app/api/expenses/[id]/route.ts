// app/api/expenses/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

function isSamePayrollMonth(expenseDate: Date, budgetMonth: Date): boolean {
  return (
    expenseDate.getFullYear() === budgetMonth.getFullYear() &&
    expenseDate.getMonth() === budgetMonth.getMonth()
  );
}

export async function PUT(req: Request, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = context.params;
  const old = await prisma.expense.findUnique({ where: { id } });
  if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (old.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();

  const title = formData.get("title") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const category = formData.get("category") as string | null;
  const description = formData.get("description") as string | null;
  const date = new Date(formData.get("date") as string);
  const accountId = formData.get("accountId") as string;

  const rawPhoto = formData.get("photo");
  const photo = rawPhoto instanceof File ? rawPhoto : null;

  const removePhoto = formData.get("removePhoto") === "true";

  const rawBudget = formData.get("budgetId");
  const budgetId =
    typeof rawBudget === "string" && rawBudget.trim() !== ""
      ? rawBudget
      : null;

    let validatedBudgetId: string | null = null;

  if (budgetId) {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId: session.user.id },
    });

    if (!budget)
      return NextResponse.json({ error: "Budget tidak ditemukan" }, { status: 404 });

    // Validasi payroll-month, bukan exact day
    if (!isSamePayrollMonth(date, budget.month)) {
      return NextResponse.json(
        {
          error:
            "Tanggal pengeluaran harus berada dalam bulan payroll yang sama dengan budget",
        },
        { status: 400 }
      );
    }

    validatedBudgetId = budget.id;
  }

  const result = await prisma.$transaction(async (tx) => {
      // Balikin saldo lama
      await tx.accountBalance.update({
        where: { id: old.accountId },
        data: { balance: { increment: old.amount } },
      });

      // Photo handling
      let photoUrl = old.photoUrl;

      // Hapus foto
      if (removePhoto && photoUrl) {
        try {
          fs.unlinkSync(path.join(process.cwd(), "public", photoUrl));
        } catch {}
        photoUrl = null;
      }

      // Upload foto baru
      if (photo) {
        const bytes = await photo.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(
          process.cwd(),
          "public/uploads/expenses"
        );
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${photo.name}`;
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        photoUrl = `/uploads/expenses/${fileName}`;
      }

      // Update expense
      const updated = await tx.expense.update({
        where: { id },
        data: {
          title,
          amount,
          category,
          description,
          date,
          accountId,
          photoUrl,
          budgetId: validatedBudgetId,
        },
      });

      // Apply saldo baru
      await tx.accountBalance.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });

      return updated;
    });

  return NextResponse.json(result);
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = context.params;

  const old = await prisma.expense.findUnique({ where: { id } });
  if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // balikin saldo
  await prisma.accountBalance.update({
    where: { id: old.accountId },
    data: { balance: { increment: old.amount } },
  });

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}