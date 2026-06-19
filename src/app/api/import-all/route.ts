import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid" }, { status: 400 })
  }

  if (!data.version || !data.exportedAt) {
    return NextResponse.json({ error: "File bukan backup Vest AI yang valid" }, { status: 400 })
  }

  const counts = { expenses: 0, incomes: 0, assets: 0, accountBalances: 0, budgets: 0, expenseCategories: 0 }

  try {
    // Import account balances first (expenses/incomes reference them)
    if (Array.isArray(data.accountBalances)) {
      for (const item of data.accountBalances as Record<string, unknown>[]) {
        await prisma.accountBalance.upsert({
          where: { id: item.id as string },
          update: {},
          create: {
            id: item.id as string,
            name: item.name as string,
            type: item.type as string,
            balance: item.balance as number,
            createdAt: new Date(item.createdAt as string),
            userId,
          },
        })
        counts.accountBalances++
      }
    }

    if (Array.isArray(data.budgets)) {
      for (const item of data.budgets as Record<string, unknown>[]) {
        await prisma.budget.upsert({
          where: { id: item.id as string },
          update: {},
          create: {
            id: item.id as string,
            name: item.name as string,
            category: item.category as string | null,
            limit: item.limit as number,
            month: new Date(item.month as string),
            notes: item.notes as string | null,
            createdAt: new Date(item.createdAt as string),
            updatedAt: new Date(item.updatedAt as string),
            userId,
          },
        })
        counts.budgets++
      }
    }

    if (Array.isArray(data.expenseCategories)) {
      for (const item of data.expenseCategories as Record<string, unknown>[]) {
        await prisma.expenseCategory.upsert({
          where: { userId_value: { userId, value: item.value as string } },
          update: {},
          create: {
            id: item.id as string,
            value: item.value as string,
            label: item.label as string,
            createdAt: new Date(item.createdAt as string),
            updatedAt: new Date(item.updatedAt as string),
            userId,
          },
        })
        counts.expenseCategories++
      }
    }

    if (Array.isArray(data.expenses)) {
      for (const item of data.expenses as Record<string, unknown>[]) {
        await prisma.expense.upsert({
          where: { id: item.id as string },
          update: {},
          create: {
            id: item.id as string,
            title: item.title as string,
            amount: item.amount as number,
            category: item.category as string | null,
            description: item.description as string | null,
            photoUrl: item.photoUrl as string | null,
            date: new Date(item.date as string),
            createdAt: new Date(item.createdAt as string),
            userId,
            accountId: item.accountId as string | null,
            budgetId: item.budgetId as string | null,
          },
        })
        counts.expenses++
      }
    }

    if (Array.isArray(data.incomes)) {
      for (const item of data.incomes as Record<string, unknown>[]) {
        await prisma.income.upsert({
          where: { id: item.id as string },
          update: {},
          create: {
            id: item.id as string,
            title: item.title as string,
            amount: item.amount as number,
            date: new Date(item.date as string),
            createdAt: new Date(item.createdAt as string),
            userId,
            accountId: item.accountId as string | null,
          },
        })
        counts.incomes++
      }
    }

    if (Array.isArray(data.assets)) {
      for (const item of data.assets as Record<string, unknown>[]) {
        await prisma.asset.upsert({
          where: { id: item.id as string },
          update: {},
          create: {
            id: item.id as string,
            name: item.name as string,
            coinId: item.coinId as string | null,
            type: item.type as string,
            category: item.category as string | null,
            color: item.color as string | null,
            amount: item.amount as number | null,
            buyPrice: item.buyPrice as number | null,
            positionX: item.positionX as number | null,
            positionY: item.positionY as number | null,
            createdAt: new Date(item.createdAt as string),
            userId,
          },
        })
        counts.assets++
      }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    return NextResponse.json({
      message: `Berhasil mengimpor ${total} item (${counts.expenses} pengeluaran, ${counts.incomes} pemasukan, ${counts.assets} aset, ${counts.accountBalances} akun, ${counts.budgets} budget)`,
      counts,
    })
  } catch (err) {
    console.error("Import error:", err)
    return NextResponse.json({ error: "Gagal mengimpor data. Pastikan file backup valid." }, { status: 500 })
  }
}
