import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExpenseSummaryCardsProps {
    totalExpenses: number;
    expensesCount: number;
    averageExpense: number;
    topCategory: string;
    formatCurrency: (value: number) => string;
}

export function ExpenseSummaryCards({
    totalExpenses,
    expensesCount,
    averageExpense,
    topCategory,
    formatCurrency,
}: ExpenseSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Pengeluaran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {expensesCount} transaksi
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Rata-rata per Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(averageExpense)}
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Kategori Terbanyak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {topCategory || '-'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}