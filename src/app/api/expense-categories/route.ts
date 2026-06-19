import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EXPENSE_CATEGORIES } from "@/lib/expenseUtils";
import {
  createCustomExpenseCategory,
  findCustomExpenseCategory,
  listCustomExpenseCategories,
} from "@/lib/expenseCategories";

const slugifyCategory = (label: string) => {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || `kategori-${Date.now()}`;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const custom = await listCustomExpenseCategories(session.user.id);

  return NextResponse.json({ defaults: EXPENSE_CATEGORIES, custom });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const label = typeof body.label === "string" ? body.label.trim() : "";

  if (label.length < 2) {
    return NextResponse.json({ error: "Nama kategori minimal 2 karakter" }, { status: 400 });
  }

  const defaultExists = EXPENSE_CATEGORIES.some((category) => category.label.toLowerCase() === label.toLowerCase());
  if (defaultExists) {
    return NextResponse.json({ error: "Kategori default sudah tersedia" }, { status: 409 });
  }

  const valueBase = slugifyCategory(label);
  let value = valueBase;
  let suffix = 2;

  while (await findCustomExpenseCategory(session.user.id, value)) {
    value = `${valueBase}-${suffix}`;
    suffix += 1;
  }

  const category = await createCustomExpenseCategory(session.user.id, value, label);

  return NextResponse.json(category, { status: 201 });
}
