import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { useLanguage } from '@/lib/i18n/context';

interface ExpenseFiltersProps {
  filterCategory: string;
  filterStartDate: string;
  filterEndDate: string;
  onCategoryChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  categories: Array<{ value: string; label: string }>;
  month: string;
  onMonthChange: (value: string) => void;
  onResetMonth: () => void;
}

export function ExpenseFilters({
  filterCategory,
  filterStartDate,
  filterEndDate,
  onCategoryChange,
  onStartDateChange,
  onEndDateChange,
  categories,
  month,
  onMonthChange,
  onResetMonth,
}: ExpenseFiltersProps) {
  const { t } = useLanguage()
  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">Filter & History</CardTitle>
          <p className="text-sm text-muted-foreground">{t.financial.selectMonthHint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            aria-label={t.financial.budgetMonthLabel}
            type="month"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-36"
          />
          <button
            type="button"
            onClick={onResetMonth}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {t.financial.thisMonthBtn}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="filter-category">{t.financial.categories}</Label>
            <Select value={filterCategory} onValueChange={onCategoryChange}>
              <SelectTrigger id="filter-category">
                <SelectValue placeholder={t.financial.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.financial.allCategories}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-start-date">{t.financial.fromDate}</Label>
            <DateTimePicker
              id="filter-start-date"
              withTime={false}
              placeholder={t.financial.fromDate}
              value={filterStartDate}
              onChange={onStartDateChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-end-date">{t.financial.toDate}</Label>
            <DateTimePicker
              id="filter-end-date"
              withTime={false}
              placeholder={t.financial.toDate}
              value={filterEndDate}
              onChange={onEndDateChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}