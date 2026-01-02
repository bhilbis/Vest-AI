/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/expenses/export/route.ts
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { toMonthStart } from "@/lib/constant";

const getMonthRange = (monthStart: Date) => {
  const start = new Date(monthStart);
  const end = new Date(monthStart);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  const where: any = { userId: session.user.id };

  try {
    const monthStart = toMonthStart(searchParams.get("month"));
    const { start, end } = getMonthRange(monthStart);
    where.date = { gte: start, lt: end };
  } catch (err) {
    console.error("Invalid month format in expenses export API:", err);
    return NextResponse.json({ error: "Format bulan tidak valid" }, { status: 400 });
  }

  if (searchParams.get("category")) where.category = searchParams.get("category");
  if (searchParams.get("startDate"))
    where.date = { ...(where.date ?? {}), gte: new Date(searchParams.get("startDate")!) };
  if (searchParams.get("endDate")) {
    where.date = {
      ...(where.date ?? {}),
      lte: new Date(searchParams.get("endDate")! + "T23:59:59"),
    };
  }

  const items = await prisma.expense.findMany({ where, orderBy: { date: "desc" } });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Expenses");

  sheet.columns = [
    { header: "Title", key: "title", width: 25 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Category", key: "category", width: 15 },
    { header: "Description", key: "description", width: 30 },
    { header: "Date", key: "date", width: 15 },
  ];

  items.forEach((e: any) =>
    sheet.addRow({
      title: e.title,
      amount: e.amount,
      category: e.category,
      description: e.description,
      date: e.date.toISOString().split("T")[0],
    })
  );

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=expenses.xlsx",
    },
  });
}