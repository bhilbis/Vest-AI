"use client"

import { ArrowDownRight, ArrowLeftRight, ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/expenseUtils"
import { useLanguage } from "@/lib/i18n/context"

type HistoryRecord = {
  id: string
  type: "expense" | "income" | "transfer"
  title: string
  amount: number
  category: string
  date: string
  accountName: string | undefined
}

export function TransactionsClient({ records }: { records: HistoryRecord[] }) {
  const { t, dateLocale } = useLanguage()

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t.financial.transactionHistoryTitle}
          </h1>
          <p className="text-sm text-muted-foreground">{t.financial.allActivityDesc}</p>
        </div>
      </header>

      <div className="rounded-xl shadow-sm border border-border bg-card overflow-hidden">
        {records.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-2xl mb-1">📭</p>
            <p className="text-sm text-muted-foreground">{t.financial.noActivity}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {records.map((record) => {
              const isIncome = record.type === "income"
              const isTransfer = record.type === "transfer"
              const Icon = isIncome ? ArrowUpRight : isTransfer ? ArrowLeftRight : ArrowDownRight
              const color = isIncome
                ? "text-green-500 dark:text-green-400 bg-green-500/10 dark:bg-green-400/10"
                : isTransfer
                ? "text-blue-500 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10"
                : "text-destructive bg-destructive/10"

              return (
                <li
                  key={record.id + record.type}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", color)}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{record.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(record.date).toLocaleDateString(dateLocale, {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      {record.category && record.category !== "transfer" && record.category !== "income" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize border-border text-muted-foreground h-4 py-0 px-1.5 min-h-0 min-w-0"
                        >
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
                  <p
                    className={cn(
                      "text-sm font-bold tabular-nums shrink-0",
                      isIncome ? "text-green-500 dark:text-green-400" : "text-destructive"
                    )}
                  >
                    {isIncome ? "+" : "−"}{formatCurrency(record.amount)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
