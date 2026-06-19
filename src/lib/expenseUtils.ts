import type { Translations } from "@/lib/i18n/en"

export type ExpenseCategoryOption = { value: string; label: string };

// Default category values — labels are set per-locale via getExpenseCategories()
export const EXPENSE_CATEGORY_VALUES = [
  'food', 'transport', 'shopping', 'bills',
  'entertainment', 'health', 'education', 'other',
] as const;

// Fallback (Indonesian) — used where no locale context is available (e.g. server side)
export const EXPENSE_CATEGORIES: ExpenseCategoryOption[] = [
  { value: 'food',          label: 'Makanan & Minuman' },
  { value: 'transport',     label: 'Transportasi' },
  { value: 'shopping',      label: 'Belanja' },
  { value: 'bills',         label: 'Tagihan' },
  { value: 'entertainment', label: 'Hiburan' },
  { value: 'health',        label: 'Kesehatan' },
  { value: 'education',     label: 'Pendidikan' },
  { value: 'other',         label: 'Lainnya' },
];

// Returns locale-aware built-in categories using the active translations
export const getExpenseCategories = (t: Translations): ExpenseCategoryOption[] => [
  { value: 'food',          label: t.categories.food          },
  { value: 'transport',     label: t.categories.transport     },
  { value: 'shopping',      label: t.categories.shopping      },
  { value: 'bills',         label: t.categories.bills         },
  { value: 'entertainment', label: t.categories.entertainment },
  { value: 'health',        label: t.categories.health        },
  { value: 'education',     label: t.categories.education     },
  { value: 'other',         label: t.categories.other         },
];

export const mergeExpenseCategories = (
  customCategories: ExpenseCategoryOption[] = [],
  baseCategories: ExpenseCategoryOption[] = EXPENSE_CATEGORIES
): ExpenseCategoryOption[] => {
  const map = new Map<string, ExpenseCategoryOption>();
  baseCategories.forEach((category) => map.set(category.value, category));
  customCategories.forEach((category) => {
    if (category.value && category.label) map.set(category.value, category);
  });
  return Array.from(map.values());
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const getCategoryLabel = (
  category: string | null,
  categories: ExpenseCategoryOption[] = EXPENSE_CATEGORIES
): string => {
  return (
    categories.find((c) => c.value === category)?.label ||
    category ||
    'Other'
  );
};

export const calculateExpenseSummary = (expenses: Array<{ amount: number; category: string | null }>) => {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const count = expenses.length;
  const average = count > 0 ? total / count : 0;

  const categoryTotals = expenses.reduce((acc, e) => {
    const cat = e.category || 'other';
    acc[cat] = (acc[cat] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategoryValue =
    Object.keys(categoryTotals).length > 0
      ? Object.keys(categoryTotals).reduce((a, b) =>
          categoryTotals[a] > categoryTotals[b] ? a : b
        )
      : null;

  const topCategory = topCategoryValue
    ? getCategoryLabel(topCategoryValue)
    : '-';

  return {
    total,
    count,
    average,
    topCategory,
    categoryTotals,
  };
};
