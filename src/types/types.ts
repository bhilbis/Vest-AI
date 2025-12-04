export interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string | null;
    description: string | null;
    photoUrl: string | null;
    date: string;
    createdAt: string;
    accountId: string;
    budgetId?: string | null;
    budget?: { id: string; name: string } | null;
    account?: { id: string; name: string }
}

export interface Budget {
    id: string;
    name: string;
    category: string | null;
    limit: number;
    month: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    spent?: number;
    remaining?: number;
    monthKey?: string;
}