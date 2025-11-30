export const EXPENSE_CATEGORIES = [
    { value: 'food', label: 'Makanan & Minuman' },
    { value: 'transport', label: 'Transportasi' },
    { value: 'shopping', label: 'Belanja' },
    { value: 'bills', label: 'Tagihan' },
    { value: 'entertainment', label: 'Hiburan' },
    { value: 'health', label: 'Kesehatan' },
    { value: 'education', label: 'Pendidikan' },
    { value: 'other', label: 'Lainnya' },
  ];
  
  export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  export const getCategoryLabel = (category: string | null): string => {
    return (
      EXPENSE_CATEGORIES.find((c) => c.value === category)?.label ||
      category ||
      'Lainnya'
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