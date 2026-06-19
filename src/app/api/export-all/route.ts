import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const [
    expenses,
    incomes,
    accountBalances,
    accountTransfers,
    budgets,
    expenseCategories,
    assets,
    semesters,
    mataKuliah,
    kuliahSettings,
    examPreps,
  ] = await Promise.all([
    prisma.expense.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.income.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.accountBalance.findMany({ where: { userId } }),
    prisma.accountTransfer.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.expenseCategory.findMany({ where: { userId } }),
    prisma.asset.findMany({ where: { userId } }),
    prisma.semester.findMany({ where: { userId }, include: { mataKuliah: { include: { sessions: true } } } }),
    prisma.mataKuliah.findMany({ where: { semester: { userId } }, include: { sessions: true } }),
    prisma.kuliahSettings.findFirst({ where: { userId } }),
    prisma.examPrep.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ])

  const backup = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    expenses,
    incomes,
    accountBalances,
    accountTransfers,
    budgets,
    expenseCategories,
    assets,
    semesters,
    mataKuliah,
    kuliahSettings,
    examPreps,
  }

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="vest-ai-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
