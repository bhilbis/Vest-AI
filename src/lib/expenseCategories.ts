import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export type StoredExpenseCategory = {
  id: string;
  value: string;
  label: string;
};

export async function listCustomExpenseCategories(userId: string) {
  try {
    return await prisma.$queryRaw<StoredExpenseCategory[]>`
      SELECT "id", "value", "label"
      FROM "ExpenseCategory"
      WHERE "userId" = ${userId}
      ORDER BY "label" ASC
    `;
  } catch (error) {
    console.error("Error loading custom expense categories:", error);
    return [];
  }
}

export async function findCustomExpenseCategory(userId: string, value: string) {
  const rows = await prisma.$queryRaw<StoredExpenseCategory[]>`
    SELECT "id", "value", "label"
    FROM "ExpenseCategory"
    WHERE "userId" = ${userId} AND "value" = ${value}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function createCustomExpenseCategory(userId: string, value: string, label: string) {
  const id = randomUUID();
  const rows = await prisma.$queryRaw<StoredExpenseCategory[]>`
    INSERT INTO "ExpenseCategory" ("id", "userId", "value", "label", "createdAt", "updatedAt")
    VALUES (${id}, ${userId}, ${value}, ${label}, NOW(), NOW())
    RETURNING "id", "value", "label"
  `;
  return rows[0];
}
