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

  const items = await prisma.expense.findMany({ 
    where, 
    orderBy: { date: "desc" },
    include: {
      account: { select: { name: true } }
    }
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Pengeluaran");

  // Add metadata
  sheet.addRow(["LAPORAN PENGELUARAN"]);
  sheet.addRow([`Periode: ${searchParams.get("month") || "Semua"}`]);
  sheet.addRow([]);

  // Style Title
  sheet.mergeCells("A1:F1");
  const titleCell = sheet.getCell("A1");
  titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF3B82F6" } };
  titleCell.alignment = { horizontal: "center" };

  // Define Columns
  sheet.columns = [
    { header: "Tanggal", key: "date", width: 15 },
    { header: "Judul", key: "title", width: 30 },
    { header: "Kategori", key: "category", width: 15 },
    { header: "Akun", key: "account", width: 15 },
    { header: "Deskripsi", key: "description", width: 35 },
    { header: "Nominal", key: "amount", width: 20 },
  ];

  // Style Header Row
  const headerRow = sheet.getRow(4);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E293B" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  // Add Data
  items.forEach((e: any) => {
    const row = sheet.addRow({
      date: e.date.toISOString().split("T")[0],
      title: e.title,
      category: e.category || "-",
      account: e.account?.name || "-",
      description: e.description || "-",
      amount: e.amount,
    });
    
    // Format amount column
    row.getCell("amount").numFmt = "#,##0";
    row.getCell("date").alignment = { horizontal: "center" };
  });

  // Add Total Row
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const totalRow = sheet.addRow({
    date: "",
    title: "TOTAL",
    category: "",
    account: "",
    description: "",
    amount: totalAmount,
  });

  totalRow.font = { bold: true };
  totalRow.getCell("amount").numFmt = "#,##0";
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" },
  };

  // Add borders to all cells with data
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 4) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFCBD5E1" } },
          left: { style: "thin", color: { argb: "FFCBD5E1" } },
          bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
          right: { style: "thin", color: { argb: "FFCBD5E1" } },
        };
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();

  const filename = `Pengeluaran-${searchParams.get("month") || "All"}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}