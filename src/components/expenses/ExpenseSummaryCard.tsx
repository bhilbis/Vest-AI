import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/i18n/context"

interface ExpenseSummaryCardsProps {
  totalExpenses: number
  expensesCount: number
  averageExpense: number
  topCategory: string
  formatCurrency: (value: number) => string
}

export function ExpenseSummaryCards({
  totalExpenses,
  expensesCount,
  averageExpense,
  topCategory,
  formatCurrency,
}: ExpenseSummaryCardsProps) {
  const { t } = useLanguage()
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t.financial.totalExpensesLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-foreground">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {expensesCount} {t.common.transactions}
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t.financial.avgPerTransaction}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-primary">
            {formatCurrency(averageExpense)}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t.financial.topCategory}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold text-foreground">
            {topCategory || "-"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


