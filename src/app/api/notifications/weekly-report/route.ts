import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { weeklyReportTemplate } from "@/lib/email-templates"

// Called by Vercel Cron every Monday 08:00 WIB (01:00 UTC): "0 1 * * 1"
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)

  const users = await prisma.user.findMany({
    where: { email: { not: null }, isActive: true },
    select: { id: true, name: true, email: true },
  })

  let sent = 0
  let failed = 0

  for (const user of users) {
    if (!user.email) continue

    try {
      const [incomes, expenses] = await Promise.all([
        prisma.income.findMany({
          where: { userId: user.id, date: { gte: weekStart, lte: now } },
          select: { amount: true },
        }),
        prisma.expense.findMany({
          where: { userId: user.id, date: { gte: weekStart, lte: now } },
          select: { amount: true, category: true },
        }),
      ])

      const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
      const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)
      const netCashflow = totalIncome - totalExpense

      // Find top spending category
      const categoryTotals: Record<string, number> = {}
      for (const e of expenses) {
        const cat = e.category || "Lainnya"
        categoryTotals[cat] = (categoryTotals[cat] ?? 0) + e.amount
      }
      const topCategory =
        Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-"

      await sendEmail(
        user.email,
        "Laporan Mingguan Vest AI",
        weeklyReportTemplate({
          name: user.name || "Member",
          totalIncome,
          totalExpense,
          netCashflow,
          topCategory,
        }),
      )
      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, failed })
}
