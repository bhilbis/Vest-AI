import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ExpenseCard } from './ExpenseCard';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string | null;
  description: string | null;
  photoUrl: string | null;
  date: string;
  createdAt: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  formatCurrency: (value: number) => string;
  getCategoryLabel: (category: string | null) => string;
}

export function ExpenseList({
  expenses,
  loading,
  onEdit,
  onDelete,
  formatCurrency,
  getCategoryLabel,
}: ExpenseListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat data pengeluaran...</p>
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Belum ada pengeluaran</h3>
            <p className="text-muted-foreground">
              Tambahkan pengeluaran pertama Anda dengan menekan tombol "Tambah Pengeluaran" di atas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
          formatCurrency={formatCurrency}
          getCategoryLabel={getCategoryLabel}
        />
      ))}
    </div>
  );
}