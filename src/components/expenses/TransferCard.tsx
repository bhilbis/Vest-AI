/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from '@/components/ui/card';

export function TransferCard({ item, formatCurrency }: any) {
  const formattedDate = new Date(item.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm mb-0.5 truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {formattedDate}
            </p>
          </div>
          <p className="font-bold text-base text-blue-600 shrink-0">
            {formatCurrency(item.amount)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}