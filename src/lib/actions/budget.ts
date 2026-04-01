"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BudgetSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createBudget(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const raw = {
    name: formData.get("name"),
    category: formData.get("category") || "",
    limit: formData.get("limit"),
    month: formData.get("month"),
    notes: formData.get("notes") || "",
  };

  const parsed = BudgetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  try {
    const { name, category, limit, month, notes } = parsed.data;
    const monthDate = new Date(`${month}-01T00:00:00.000Z`);

    await prisma.budget.create({
      data: {
        name,
        category,
        limit,
        month: monthDate,
        notes,
        userId: session.user.id,
      },
    });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("createBudget error:", err);
    return { error: "Gagal membuat budget" };
  }
}

export async function updateBudget(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  const raw = {
    name: formData.get("name"),
    category: formData.get("category") || "",
    limit: formData.get("limit"),
    month: formData.get("month"),
    notes: formData.get("notes") || "",
  };

  const parsed = BudgetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Data tidak valid" };
  }

  try {
    const { name, category, limit, month, notes } = parsed.data;
    const monthDate = new Date(`${month}-01T00:00:00.000Z`);

    const existing = await prisma.budget.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Budget tidak ditemukan" };

    await prisma.budget.update({
      where: { id },
      data: { name, category, limit, month: monthDate, notes },
    });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("updateBudget error:", err);
    return { error: "Gagal mengupdate budget" };
  }
}

export async function deleteBudget(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const existing = await prisma.budget.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Budget tidak ditemukan" };

    await prisma.budget.delete({ where: { id } });

    revalidatePath("/financial-overview");
    return { success: true };
  } catch (err) {
    console.error("deleteBudget error:", err);
    return { error: "Gagal menghapus budget" };
  }
}
