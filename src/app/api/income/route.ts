// app/api/income/route.ts
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { getIncomes, createIncome } from "@/lib/services/incomeService";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get("month");

  try {
    const incomes = await getIncomes({
      userId: session.user.id,
      monthParam,
    });
    return NextResponse.json(incomes);
  } catch (error) {
    console.error("Error fetching incomes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.json();
  const { title, amount, date, accountId } = form;

  if (!title || !amount || !accountId) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const result = await createIncome({
      title,
      amount,
      date: new Date(date),
      userId: session.user.id,
      accountId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating income:", error);
    return NextResponse.json(
      { error: "Failed to create income" },
      { status: 500 }
    );
  }
}