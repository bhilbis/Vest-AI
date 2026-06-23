import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { TransactionsClient } from "@/components/financial/TransactionsClient"

export const dynamic = "force-dynamic"

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  // Fetch all transactions
  const [expenses, incomes, transfers] = await Promise.all([
    prisma.expense.findMany({
      where: { userId },
      include: { account: true },
      orderBy: { date: "desc" },
    }),
    prisma.income.findMany({
      where: { userId },
      include: { account: true },
      orderBy: { date: "desc" },
    }),
    prisma.accountTransfer.findMany({
      where: { userId },
      include: { fromAccount: true, toAccount: true },
      orderBy: { date: "desc" },
    }),
  ])

  const mergedHistory = [
    ...expenses.map((ex) => ({
      type: "expense" as const,
      id: ex.id,
      title: ex.title,
      amount: ex.amount,
      category: ex.category || "",
      date: ex.date instanceof Date ? ex.date.toISOString() : String(ex.date),
      accountName: ex.account?.name,
    })),
    ...incomes.map((inc) => ({
      type: "income" as const,
      id: inc.id,
      title: inc.title,
      amount: inc.amount,
      category: "income",
      date: inc.date.toISOString(),
      accountName: inc.account?.name,
    })),
    ...transfers.map((tr) => ({
      type: "transfer" as const,
      id: tr.id,
      title: `${tr.fromAccount?.name || "?"} → ${tr.toAccount?.name || "?"}`,
      amount: tr.amount,
      category: "transfer",
      date: tr.date.toISOString(),
      accountName: tr.fromAccount?.name,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <PageWrapper maxWidth="lg">
      <TransactionsClient records={mergedHistory} />
    </PageWrapper>
  )
}
