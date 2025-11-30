// app/api/expenses/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function PUT(req: Request, { params }: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  const old = await prisma.expense.findUnique({ where: { id } });
  if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();

  const title = formData.get("title") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const category = formData.get("category") as string | null;
  const description = formData.get("description") as string | null;
  const date = new Date(formData.get("date") as string);
  const accountId = formData.get("accountId") as string;
  const removePhoto = formData.get("removePhoto") === "true";
  const photo = formData.get("photo") as File | null;

  // rollback saldo lama
  await prisma.accountBalance.update({
    where: { id: old.accountId },
    data: { balance: { increment: old.amount } },
  });

  // upload foto baru / hapus
  let photoUrl = old.photoUrl;
  if (removePhoto && photoUrl) {
    try { fs.unlinkSync(path.join(process.cwd(), "public", photoUrl)); } catch {}
    photoUrl = null;
  }
  if (photo) {
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public/uploads/expenses");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${photo.name}`;
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);
    photoUrl = `/uploads/expenses/${fileName}`;
  }

  // update expense
  const updated = await prisma.expense.update({
    where: { id },
    data: {
      title,
      amount,
      category,
      description,
      date,
      accountId,
      photoUrl,
    },
  });

  // apply saldo baru
  await prisma.accountBalance.update({
    where: { id: accountId },
    data: { balance: { decrement: amount } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  const old = await prisma.expense.findUnique({ where: { id } });
  if (!old) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // balikin saldo account
  await prisma.accountBalance.update({
    where: { id: old.accountId },
    data: { balance: { increment: old.amount } },
  });

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
