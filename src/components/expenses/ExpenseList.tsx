/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { ExpenseCard } from './ExpenseCard';
import { TransferCard } from './TransferCard';

export type HistoryItem = {
  id: string;
  type: "expense" | "transfer";
  title: string;
  amount: number;
  category: string | null;
  description: string | null;
  photoUrl: string | null;
  date: string;
  createdAt?: string;
  accountId?: string | null;
};

interface ExpenseListProps {
  expenses: HistoryItem[];
  loading: boolean;
  onEdit: (expense: any) => void;
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
            <h3 className="text-lg font-semibold mb-2">Belum ada transaksi</h3>
            <p className="text-muted-foreground">
              Tambahkan data pertama Anda.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const expenseItems = expenses.filter((item) => item.type === "expense");
  const transferItems = expenses.filter((item) => item.type === "transfer");

  return (
    <div className="space-y-4">
      {expenseItems.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {expenseItems.map((item) => (
            <ExpenseCard
              key={item.id}
              expense={item as any}
              onEdit={onEdit}
              onDelete={onDelete}
              formatCurrency={formatCurrency}
              getCategoryLabel={getCategoryLabel}
            />
          ))}
        </div>
      )}
      
      {transferItems.length > 0 && (
        <div className="space-y-4">
          {transferItems.map((item) => (
            <TransferCard
              key={item.id}
              item={item}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      )}
    </div>
  );
}
