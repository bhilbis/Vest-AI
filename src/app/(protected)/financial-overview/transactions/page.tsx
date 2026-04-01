import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { formatCurrency } from "@/lib/expenseUtils"
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
      date: ex.date,
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
    <PageWrapper maxWidth="lg" className="space-y-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Riwayat Transaksi</h1>
          <p className="text-sm text-muted-foreground">Semua aktivitas keuangan Anda</p>
        </div>
      </header>

      <div className="rounded-xl shadow-sm border border-border bg-card overflow-hidden">
        {mergedHistory.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-2xl mb-1">📭</p>
            <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {mergedHistory.map((record) => {
              const isIncome = record.type === "income"
              const isTransfer = record.type === "transfer"
              const Icon = isIncome ? ArrowUpRight : isTransfer ? ArrowLeftRight : ArrowDownRight
              const color = isIncome
                ? "text-green-500 dark:text-green-400 bg-green-500/10 dark:bg-green-400/10"
                : isTransfer
                ? "text-blue-500 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10"
                : "text-destructive bg-destructive/10"

              return (
                <li key={record.id + record.type} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", color)}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{record.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(record.date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric"
                        })}
                      </span>
                      {record.category && record.category !== "transfer" && record.category !== "income" && (
                        <Badge variant="outline" className="text-[10px] capitalize border-border text-muted-foreground h-4 py-0 px-1.5 min-h-0 min-w-0">
                          {record.category}
                        </Badge>
                      )}
                      {record.accountName && (
                        <span className="text-[10px] text-muted-foreground/70 bg-secondary px-1.5 py-0.5 rounded-sm">
                          {record.accountName}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={cn("text-sm font-bold tabular-nums shrink-0", isIncome ? "text-green-500 dark:text-green-400" : "text-destructive")}>
                    {isIncome ? "+" : "−"}{formatCurrency(record.amount)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </PageWrapper>
  )
}
