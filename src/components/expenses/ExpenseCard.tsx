import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditIcon, TrashIcon } from 'lucide-react';
import Image from 'next/image';
import { Expense } from '@/types/types';

interface ExpenseCardProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  formatCurrency: (value: number) => string;
  getCategoryLabel: (category: string | null) => string;
}

export function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  formatCurrency,
  getCategoryLabel,
}: ExpenseCardProps) {
  const formattedDate = new Date(expense.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 group">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
        {expense.account && (
          <p className="text-xs text-blue-500">
            Dari akun: {expense.account.name}
          </p>
        )}
          {expense.photoUrl && (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Image
                src={expense.photoUrl}
                alt={expense.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                  {expense.title}
                </h3>
                
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="secondary" className="font-medium">
                    {getCategoryLabel(expense.category)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formattedDate}
                  </span>
                </div>
                
                {expense.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {expense.description}
                  </p>
                )}
                
                <div className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(expense)}
                  className="hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  title="Edit pengeluaran"
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(expense.id)}
                  className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                  title="Hapus pengeluaran"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}