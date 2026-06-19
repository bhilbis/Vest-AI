/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { toMonthStart } from "@/lib/constant";
import { getCategoryLabel, mergeExpenseCategories } from "@/lib/expenseUtils";
import { listCustomExpenseCategories } from "@/lib/expenseCategories";

const CURRENCY_FORMAT = '"Rp" #,##0';
const PERCENT_FORMAT = '0.00"%"';

const monthKey = (date: Date) => date.toISOString().slice(0, 7);
const dateKey = (date: Date) => date.toISOString().slice(0, 10);

const formatMonth = (key: string) => {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
};

const weekKey = (date: Date) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  return start.toISOString().slice(0, 10);
};

const nextMonth = (date: Date, offset = 1) => {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + offset);
  return next;
};

const previousDay = (date: Date) => {
  const previous = new Date(date);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous;
};

const addReportHeader = (sheet: ExcelJS.Worksheet, title: string, subtitle: string, width: number) => {
  sheet.addRow([title]);
  sheet.addRow([subtitle]);
  sheet.addRow([`Dibuat: ${new Date().toLocaleString("id-ID")}`]);
  sheet.addRow([]);
  sheet.mergeCells(1, 1, 1, width);
  sheet.mergeCells(2, 1, 2, width);
  sheet.mergeCells(3, 1, 3, width);

  sheet.getCell(1, 1).font = { name: "Arial", size: 18, bold: true, color: { argb: "FF0F172A" } };
  sheet.getCell(2, 1).font = { name: "Arial", size: 11, color: { argb: "FF475569" } };
  sheet.getCell(3, 1).font = { name: "Arial", size: 10, color: { argb: "FF64748B" } };
  [1, 2, 3].forEach((row) => {
    sheet.getCell(row, 1).alignment = { horizontal: "center" };
  });
};

const setColumns = (
  sheet: ExcelJS.Worksheet,
  columns: { header: string; key: string; width: number }[]
) => {
  sheet.columns = columns.map(({ key, width }) => ({ key, width }));
  const row = sheet.addRow(columns.map((column) => column.header));
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  row.alignment = { horizontal: "center", vertical: "middle" };
  row.height = 22;
  return row.number;
};

const styleRows = (sheet: ExcelJS.Worksheet, startRow: number) => {
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < startRow) return;
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });
};

const applyCurrency = (sheet: ExcelJS.Worksheet, keys: string[]) => {
  keys.forEach((key) => {
    const column = sheet.getColumn(key);
    column.numFmt = CURRENCY_FORMAT;
  });
};

const applyPercent = (sheet: ExcelJS.Worksheet, keys: string[]) => {
  keys.forEach((key) => {
    const column = sheet.getColumn(key);
    column.numFmt = PERCENT_FORMAT;
  });
};

const addTotalRow = (sheet: ExcelJS.Worksheet, values: Record<string, string | number>) => {
  const row = sheet.addRow(values);
  row.font = { bold: true, color: { argb: "FF0F172A" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let selectedMonth: Date;
  try {
    selectedMonth = toMonthStart(searchParams.get("month"));
  } catch {
    return NextResponse.json({ error: "Format bulan tidak valid" }, { status: 400 });
  }

  const userId = session.user.id;
  const currentStart = selectedMonth;
  const currentEnd = nextMonth(selectedMonth);
  const previousStart = nextMonth(selectedMonth, -1);
  const comparisonStart = nextMonth(selectedMonth, -5);
  const selectedMonthKey = monthKey(selectedMonth);

  const expenseWhere: any = {
    userId,
    date: { gte: comparisonStart, lt: currentEnd },
  };
  if (category && category !== "all") expenseWhere.category = category;

  const [expenses, incomes, transfers, accounts, budgets, customCategories] = await Promise.all([
    prisma.expense.findMany({
      where: expenseWhere,
      orderBy: [{ date: "desc" }, { amount: "desc" }],
      include: {
        account: { select: { name: true } },
        budget: { select: { id: true, name: true, limit: true } },
      },
    }),
    prisma.income.findMany({
      where: { userId, date: { gte: comparisonStart, lt: currentEnd } },
      orderBy: [{ date: "desc" }, { amount: "desc" }],
      include: { account: { select: { name: true } } },
    }),
    prisma.accountTransfer.findMany({
      where: { userId, date: { gte: currentStart, lt: currentEnd } },
      orderBy: [{ date: "desc" }],
      include: {
        fromAccount: { select: { name: true } },
        toAccount: { select: { name: true } },
      },
    }),
    prisma.accountBalance.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.budget.findMany({
      where: { userId, month: currentStart },
      orderBy: [{ name: "asc" }],
    }),
    listCustomExpenseCategories(userId),
  ]);

  const categories = mergeExpenseCategories(customCategories);
  const currentExpenses = expenses.filter((item) => item.date >= currentStart && item.date < currentEnd);
  const previousExpenses = expenses.filter((item) => item.date >= previousStart && item.date < currentStart);
  const currentIncomes = incomes.filter((item) => item.date >= currentStart && item.date < currentEnd);
  const previousIncomes = incomes.filter((item) => item.date >= previousStart && item.date < currentStart);

  const totalExpense = currentExpenses.reduce((sum, item) => sum + item.amount, 0);
  const previousExpense = previousExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = currentIncomes.reduce((sum, item) => sum + item.amount, 0);
  const previousIncome = previousIncomes.reduce((sum, item) => sum + item.amount, 0);
  const totalTransfer = transfers.reduce((sum, item) => sum + item.amount, 0);
  const totalBalance = accounts.reduce((sum, item) => sum + item.balance, 0);
  const netCashflow = totalIncome - totalExpense;
  const expenseChange = totalExpense - previousExpense;
  const expenseChangePct = previousExpense > 0 ? (expenseChange / previousExpense) * 100 : null;
  const incomeChange = totalIncome - previousIncome;
  const incomeChangePct = previousIncome > 0 ? (incomeChange / previousIncome) * 100 : null;

  const daily = new Map<string, { income: number; expense: number; transfer: number }>();
  const weekly = new Map<string, { income: number; expense: number; transfer: number }>();
  const monthly = new Map<string, { income: number; expense: number }>();
  const byCategory = new Map<string, { total: number; count: number }>();
  const byAccount = new Map<string, { income: number; expense: number }>();

  for (let i = 5; i >= 0; i -= 1) {
    monthly.set(monthKey(nextMonth(selectedMonth, -i)), { income: 0, expense: 0 });
  }

  const ensurePeriod = (map: Map<string, { income: number; expense: number; transfer: number }>, key: string) => {
    if (!map.has(key)) map.set(key, { income: 0, expense: 0, transfer: 0 });
    return map.get(key)!;
  };

  expenses.forEach((expense) => {
    const month = monthKey(expense.date);
    if (monthly.has(month)) monthly.get(month)!.expense += expense.amount;

    if (expense.date < currentStart || expense.date >= currentEnd) return;
    ensurePeriod(daily, dateKey(expense.date)).expense += expense.amount;
    ensurePeriod(weekly, weekKey(expense.date)).expense += expense.amount;

    const categoryKey = expense.category || "other";
    const categoryRow = byCategory.get(categoryKey) ?? { total: 0, count: 0 };
    categoryRow.total += expense.amount;
    categoryRow.count += 1;
    byCategory.set(categoryKey, categoryRow);

    const account = expense.account?.name || "Tanpa Akun";
    const accountRow = byAccount.get(account) ?? { income: 0, expense: 0 };
    accountRow.expense += expense.amount;
    byAccount.set(account, accountRow);
  });

  incomes.forEach((income) => {
    const month = monthKey(income.date);
    if (monthly.has(month)) monthly.get(month)!.income += income.amount;

    if (income.date < currentStart || income.date >= currentEnd) return;
    ensurePeriod(daily, dateKey(income.date)).income += income.amount;
    ensurePeriod(weekly, weekKey(income.date)).income += income.amount;

    const account = income.account?.name || "Tanpa Akun";
    const accountRow = byAccount.get(account) ?? { income: 0, expense: 0 };
    accountRow.income += income.amount;
    byAccount.set(account, accountRow);
  });

  transfers.forEach((transfer) => {
    ensurePeriod(daily, dateKey(transfer.date)).transfer += transfer.amount;
    ensurePeriod(weekly, weekKey(transfer.date)).transfer += transfer.amount;
  });

  const topCategory = Array.from(byCategory.entries()).sort((a, b) => b[1].total - a[1].total)[0];
  const topExpenses = [...currentExpenses].sort((a, b) => b.amount - a.amount).slice(0, 15);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Vest AI";
  workbook.created = new Date();
  workbook.modified = new Date();

  const periodText = `${formatMonth(selectedMonthKey)} (${dateKey(currentStart)} s/d ${dateKey(previousDay(currentEnd))})`;

  const summary = workbook.addWorksheet("01 Ringkasan");
  addReportHeader(summary, "Laporan Keuangan Bulanan", periodText, 5);
  let headerRow = setColumns(summary, [
    { header: "Bagian", key: "section", width: 24 },
    { header: "Metrik", key: "metric", width: 30 },
    { header: "Nilai", key: "value", width: 22 },
    { header: "Pembanding", key: "compare", width: 22 },
    { header: "Catatan", key: "note", width: 44 },
  ]);
  summary.addRows([
    { section: "Saldo", metric: "Total saldo akun", value: totalBalance, compare: accounts.length, note: "Jumlah saldo dari semua akun keuangan" },
    { section: "Cashflow", metric: "Total pemasukan", value: totalIncome, compare: previousIncome, note: incomeChangePct == null ? "Tidak ada pembanding" : `${incomeChangePct.toFixed(2)}% dari bulan sebelumnya` },
    { section: "Cashflow", metric: "Total pengeluaran", value: totalExpense, compare: previousExpense, note: expenseChangePct == null ? "Tidak ada pembanding" : `${expenseChangePct.toFixed(2)}% dari bulan sebelumnya` },
    { section: "Cashflow", metric: "Net cashflow", value: netCashflow, compare: totalIncome + totalExpense, note: netCashflow >= 0 ? "Surplus bulan ini" : "Defisit bulan ini" },
    { section: "Transfer", metric: "Total transfer antar akun", value: totalTransfer, compare: transfers.length, note: "Transfer tidak dihitung sebagai pengeluaran bersih" },
    { section: "Pengeluaran", metric: "Jumlah transaksi", value: currentExpenses.length, compare: currentExpenses.length ? totalExpense / currentExpenses.length : 0, note: "Pembanding berisi rata-rata transaksi" },
    { section: "Pengeluaran", metric: "Top kategori", value: topCategory ? topCategory[1].total : 0, compare: topCategory ? getCategoryLabel(topCategory[0], categories) : "-", note: "Kategori dengan pengeluaran terbesar" },
  ]);
  styleRows(summary, headerRow);
  applyCurrency(summary, ["value"]);

  const cashflow = workbook.addWorksheet("02 Cashflow");
  addReportHeader(cashflow, "Rekap Cashflow", periodText, 7);
  headerRow = setColumns(cashflow, [
    { header: "Periode", key: "period", width: 18 },
    { header: "Pemasukan", key: "income", width: 18 },
    { header: "Pengeluaran", key: "expense", width: 18 },
    { header: "Net", key: "net", width: 18 },
    { header: "Transfer", key: "transfer", width: 18 },
    { header: "Rasio Pengeluaran", key: "ratio", width: 18 },
    { header: "Catatan", key: "note", width: 30 },
  ]);
  Array.from(monthly.entries()).forEach(([month, row]) => {
    cashflow.addRow({
      period: formatMonth(month),
      income: row.income,
      expense: row.expense,
      net: row.income - row.expense,
      transfer: month === selectedMonthKey ? totalTransfer : 0,
      ratio: row.income > 0 ? (row.expense / row.income) * 100 : 0,
      note: month === selectedMonthKey ? "Bulan dipilih" : "Pembanding",
    });
  });
  addTotalRow(cashflow, { period: "TOTAL BULAN DIPILIH", income: totalIncome, expense: totalExpense, net: netCashflow, transfer: totalTransfer, ratio: totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0, note: "" });
  styleRows(cashflow, headerRow);
  applyCurrency(cashflow, ["income", "expense", "net", "transfer"]);
  applyPercent(cashflow, ["ratio"]);

  const transactions = workbook.addWorksheet("03 Transaksi");
  addReportHeader(transactions, "Semua Transaksi Bulan Dipilih", periodText, 8);
  headerRow = setColumns(transactions, [
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Tipe", key: "type", width: 14 },
    { header: "Judul", key: "title", width: 32 },
    { header: "Kategori", key: "category", width: 22 },
    { header: "Akun Asal", key: "from", width: 20 },
    { header: "Akun Tujuan", key: "to", width: 20 },
    { header: "Nominal", key: "amount", width: 18 },
    { header: "Catatan", key: "note", width: 36 },
  ]);
  const mergedTransactions = [
    ...currentIncomes.map((item) => ({ date: item.date, type: "Pemasukan", title: item.title, category: "-", from: "-", to: item.account?.name || "-", amount: item.amount, note: "" })),
    ...currentExpenses.map((item) => ({ date: item.date, type: "Pengeluaran", title: item.title, category: getCategoryLabel(item.category, categories), from: item.account?.name || "-", to: "-", amount: -item.amount, note: item.description || "" })),
    ...transfers.map((item) => ({ date: item.date, type: "Transfer", title: item.note || "Transfer antar akun", category: "-", from: item.fromAccount?.name || "-", to: item.toAccount?.name || "-", amount: item.amount, note: "Tidak memengaruhi net cashflow" })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
  mergedTransactions.forEach((item) => transactions.addRow({ ...item, date: dateKey(item.date) }));
  styleRows(transactions, headerRow);
  applyCurrency(transactions, ["amount"]);

  const expenseDetail = workbook.addWorksheet("04 Detail Pengeluaran");
  addReportHeader(expenseDetail, "Detail Pengeluaran", periodText, 9);
  headerRow = setColumns(expenseDetail, [
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Judul", key: "title", width: 30 },
    { header: "Kategori", key: "category", width: 22 },
    { header: "Akun", key: "account", width: 18 },
    { header: "Budget", key: "budget", width: 18 },
    { header: "Nominal", key: "amount", width: 18 },
    { header: "Porsi", key: "share", width: 12 },
    { header: "Deskripsi", key: "description", width: 35 },
    { header: "Bukti", key: "photo", width: 28 },
  ]);
  currentExpenses.forEach((expense) => {
    expenseDetail.addRow({
      date: dateKey(expense.date),
      title: expense.title,
      category: getCategoryLabel(expense.category, categories),
      account: expense.account?.name || "-",
      budget: expense.budget?.name || "-",
      amount: expense.amount,
      share: totalExpense > 0 ? (expense.amount / totalExpense) * 100 : 0,
      description: expense.description || "-",
      photo: expense.photoUrl || "-",
    });
  });
  addTotalRow(expenseDetail, { date: "", title: "TOTAL", category: "", account: "", budget: "", amount: totalExpense, share: 100, description: "", photo: "" });
  styleRows(expenseDetail, headerRow);
  applyCurrency(expenseDetail, ["amount"]);
  applyPercent(expenseDetail, ["share"]);

  const dailySheet = workbook.addWorksheet("05 Harian");
  addReportHeader(dailySheet, "Rekap Harian", periodText, 6);
  headerRow = setColumns(dailySheet, [
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Pemasukan", key: "income", width: 18 },
    { header: "Pengeluaran", key: "expense", width: 18 },
    { header: "Net", key: "net", width: 18 },
    { header: "Transfer", key: "transfer", width: 18 },
    { header: "Catatan", key: "note", width: 28 },
  ]);
  Array.from(daily.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([date, row]) => {
    dailySheet.addRow({ date, income: row.income, expense: row.expense, net: row.income - row.expense, transfer: row.transfer, note: row.income - row.expense >= 0 ? "Surplus" : "Defisit" });
  });
  styleRows(dailySheet, headerRow);
  applyCurrency(dailySheet, ["income", "expense", "net", "transfer"]);

  const weeklySheet = workbook.addWorksheet("06 Mingguan");
  addReportHeader(weeklySheet, "Rekap Mingguan", periodText, 6);
  headerRow = setColumns(weeklySheet, [
    { header: "Minggu Mulai", key: "week", width: 16 },
    { header: "Pemasukan", key: "income", width: 18 },
    { header: "Pengeluaran", key: "expense", width: 18 },
    { header: "Net", key: "net", width: 18 },
    { header: "Transfer", key: "transfer", width: 18 },
    { header: "Catatan", key: "note", width: 28 },
  ]);
  Array.from(weekly.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([week, row]) => {
    weeklySheet.addRow({ week, income: row.income, expense: row.expense, net: row.income - row.expense, transfer: row.transfer, note: row.income - row.expense >= 0 ? "Surplus" : "Defisit" });
  });
  styleRows(weeklySheet, headerRow);
  applyCurrency(weeklySheet, ["income", "expense", "net", "transfer"]);

  const categorySheet = workbook.addWorksheet("07 Kategori");
  addReportHeader(categorySheet, "Rekap Kategori Pengeluaran", periodText, 6);
  headerRow = setColumns(categorySheet, [
    { header: "Kategori", key: "category", width: 26 },
    { header: "Total", key: "total", width: 18 },
    { header: "Porsi", key: "share", width: 12 },
    { header: "Transaksi", key: "count", width: 12 },
    { header: "Rata-rata", key: "average", width: 18 },
    { header: "Status", key: "status", width: 20 },
  ]);
  Array.from(byCategory.entries()).sort((a, b) => b[1].total - a[1].total).forEach(([cat, row], index) => {
    categorySheet.addRow({
      category: getCategoryLabel(cat, categories),
      total: row.total,
      share: totalExpense > 0 ? (row.total / totalExpense) * 100 : 0,
      count: row.count,
      average: row.count > 0 ? row.total / row.count : 0,
      status: index === 0 ? "Top pengeluaran" : "",
    });
  });
  styleRows(categorySheet, headerRow);
  applyCurrency(categorySheet, ["total", "average"]);
  applyPercent(categorySheet, ["share"]);

  const budgetSheet = workbook.addWorksheet("08 Budget");
  addReportHeader(budgetSheet, "Rekap Budget", periodText, 7);
  headerRow = setColumns(budgetSheet, [
    { header: "Budget", key: "name", width: 26 },
    { header: "Kategori", key: "category", width: 22 },
    { header: "Limit", key: "limit", width: 18 },
    { header: "Terpakai", key: "spent", width: 18 },
    { header: "Sisa", key: "remaining", width: 18 },
    { header: "Pemakaian", key: "usage", width: 14 },
    { header: "Status", key: "status", width: 22 },
  ]);
  budgets.forEach((budget) => {
    const spent = currentExpenses.filter((expense) => expense.budgetId === budget.id).reduce((sum, expense) => sum + expense.amount, 0);
    const usage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    budgetSheet.addRow({
      name: budget.name,
      category: budget.category ? getCategoryLabel(budget.category, categories) : "-",
      limit: budget.limit,
      spent,
      remaining: budget.limit - spent,
      usage,
      status: usage >= 100 ? "Melebihi budget" : usage >= 80 ? "Perlu perhatian" : "Aman",
    });
  });
  styleRows(budgetSheet, headerRow);
  applyCurrency(budgetSheet, ["limit", "spent", "remaining"]);
  applyPercent(budgetSheet, ["usage"]);

  const comparison = workbook.addWorksheet("09 Perbandingan");
  addReportHeader(comparison, "Perbandingan Bulanan", "Enam bulan terakhir", 7);
  headerRow = setColumns(comparison, [
    { header: "Bulan", key: "month", width: 18 },
    { header: "Pemasukan", key: "income", width: 18 },
    { header: "Pengeluaran", key: "expense", width: 18 },
    { header: "Net", key: "net", width: 18 },
    { header: "Selisih Pengeluaran", key: "expenseChange", width: 20 },
    { header: "Perubahan", key: "expensePct", width: 14 },
    { header: "Catatan", key: "note", width: 24 },
  ]);
  Array.from(monthly.entries()).forEach(([month, row], index, rows) => {
    const previous = index > 0 ? rows[index - 1][1].expense : 0;
    const diff = row.expense - previous;
    comparison.addRow({
      month: formatMonth(month),
      income: row.income,
      expense: row.expense,
      net: row.income - row.expense,
      expenseChange: diff,
      expensePct: previous > 0 ? (diff / previous) * 100 : 0,
      note: month === selectedMonthKey ? "Bulan dipilih" : index === 0 ? "Bulan awal" : diff > 0 ? "Pengeluaran naik" : "Pengeluaran turun",
    });
  });
  styleRows(comparison, headerRow);
  applyCurrency(comparison, ["income", "expense", "net", "expenseChange"]);
  applyPercent(comparison, ["expensePct"]);

  const topSheet = workbook.addWorksheet("10 Top Pengeluaran");
  addReportHeader(topSheet, "Top Pengeluaran", periodText, 7);
  headerRow = setColumns(topSheet, [
    { header: "Rank", key: "rank", width: 8 },
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Judul", key: "title", width: 30 },
    { header: "Kategori", key: "category", width: 22 },
    { header: "Akun", key: "account", width: 18 },
    { header: "Nominal", key: "amount", width: 18 },
    { header: "Porsi", key: "share", width: 12 },
  ]);
  topExpenses.forEach((expense, index) => {
    topSheet.addRow({
      rank: index + 1,
      date: dateKey(expense.date),
      title: expense.title,
      category: getCategoryLabel(expense.category, categories),
      account: expense.account?.name || "-",
      amount: expense.amount,
      share: totalExpense > 0 ? (expense.amount / totalExpense) * 100 : 0,
    });
  });
  styleRows(topSheet, headerRow);
  applyCurrency(topSheet, ["amount"]);
  applyPercent(topSheet, ["share"]);

  const accountSheet = workbook.addWorksheet("11 Akun");
  addReportHeader(accountSheet, "Rekap Akun", periodText, 7);
  headerRow = setColumns(accountSheet, [
    { header: "Akun", key: "name", width: 24 },
    { header: "Tipe", key: "type", width: 14 },
    { header: "Saldo Saat Ini", key: "balance", width: 18 },
    { header: "Pemasukan Bulan Ini", key: "income", width: 20 },
    { header: "Pengeluaran Bulan Ini", key: "expense", width: 22 },
    { header: "Net Aktivitas", key: "net", width: 18 },
    { header: "Catatan", key: "note", width: 24 },
  ]);
  accounts.forEach((account) => {
    const movement = byAccount.get(account.name) ?? { income: 0, expense: 0 };
    accountSheet.addRow({
      name: account.name,
      type: account.type,
      balance: account.balance,
      income: movement.income,
      expense: movement.expense,
      net: movement.income - movement.expense,
      note: "",
    });
  });
  addTotalRow(accountSheet, { name: "TOTAL", type: "", balance: totalBalance, income: totalIncome, expense: totalExpense, net: netCashflow, note: "" });
  styleRows(accountSheet, headerRow);
  applyCurrency(accountSheet, ["balance", "income", "expense", "net"]);

  workbook.eachSheet((sheet) => {
    sheet.views = [{ state: "frozen", ySplit: 5 }];
    sheet.autoFilter = {
      from: { row: 5, column: 1 },
      to: { row: 5, column: Math.max(sheet.columnCount, 1) },
    };
    sheet.properties.defaultRowHeight = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `Laporan-Keuangan-${selectedMonthKey}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
