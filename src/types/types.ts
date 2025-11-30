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
    account?: { id: string; name: string }
}