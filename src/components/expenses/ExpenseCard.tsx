import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
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
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {expense.photoUrl && (
            <div className="relative w-16 h-16 rounded-md overflow-hidden border border-gray-200 shrink-0">
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
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100 truncate">
                  {expense.title}
                </h3>
                
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs py-0 h-5">
                    {getCategoryLabel(expense.category)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formattedDate}
                  </span>
                </div>
                
                {expense.account && (
                  <p className="text-xs text-blue-500 mb-1">
                    {expense.account.name}
                  </p>
                )}
                
                {expense.description && (
                  <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                    {expense.description}
                  </p>
                )}
                
                <div className="text-base font-bold text-blue-600">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
              
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => onEdit(expense)}
                  title="Edit"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                  onClick={() => onDelete(expense.id)}
                  title="Hapus"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}