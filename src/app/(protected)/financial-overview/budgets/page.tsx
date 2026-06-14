"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { formatCurrency } from "@/lib/expenseUtils";
import { Progress } from "@/components/ui/progress";
import { Target, AlertCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BudgetFormDialog } from "@/components/budgets/BudgetFormDialog";

type BudgetItem = {
  id: string;
  name: string;
  category: string | null;
  limit: number;
  notes: string | null;
  month: string;
  monthKey: string;
  spent: number;
  remaining: number;
};

function toMonthParam(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function BudgetsPage() {
  const now = new Date();
  const currentMonth = toMonthParam(now);

  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${currentMonth}`);
      if (!res.ok) return;
      const data = await res.json();
      setBudgets(data.budgets ?? []);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const budgetsWithUsage = budgets.map((b) => ({
    ...b,
    usage: b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0,
  }));

  const knownLabels = useMemo(
    () => [...new Set(budgets.map((b) => b.category).filter(Boolean))] as string[],
    [budgets]
  );

  const totalLimit = budgetsWithUsage.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetsWithUsage.reduce((sum, b) => sum + b.spent, 0);
  const totalUsage =
    totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;

  return (
    <PageWrapper maxWidth="lg" className="space-y-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manajemen Budget
          </h1>
          <p className="text-sm text-muted-foreground">
            Bulan ini:{" "}
            {now.toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="self-start sm:self-auto">
          <Plus size={16} className="mr-1.5" />
          Tambah Budget
        </Button>
      </header>

      {!loading && budgetsWithUsage.length > 0 && (
        <div className="rounded-xl shadow-xs border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">
            Total Penggunaan Budget
          </p>
          <div className="flex items-end justify-between mb-2">
            <p
              className={cn(
                "text-3xl font-bold tabular-nums tracking-tight",
                totalUsage > 90
                  ? "text-destructive"
                  : totalUsage > 75
                    ? "text-yellow-500"
                    : "text-primary",
              )}
            >
              {totalUsage.toFixed(1)}%
            </p>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Terpakai</p>
              <p className="text-sm font-semibold text-foreground">
                {formatCurrency(totalSpent)}
              </p>
            </div>
          </div>
          <Progress value={totalUsage} className="h-2 bg-secondary" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 animate-pulse h-40"
            />
          ))
        ) : budgetsWithUsage.length === 0 ? (
          <div className="col-span-full rounded-xl shadow-xs border border-border bg-card p-12 text-center">
            <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-base font-medium text-foreground">
              Belum ada budget bulan ini
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Klik <strong>Tambah Budget</strong> untuk mulai mengatur pengeluaran.
            </p>
          </div>
        ) : (
          budgetsWithUsage.map((budget) => {
            const isWarning = budget.usage > 75;
            const isDanger = budget.usage > 90;

            return (
              <div
                key={budget.id}
                className="group rounded-xl shadow-xs border border-border bg-card p-5 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-foreground truncate">
                      {budget.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {budget.category || "General"}
                    </p>
                  </div>
                  {isDanger && (
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Terpakai</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(budget.spent)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Limit</span>
                    <span className="font-medium text-muted-foreground">
                      {formatCurrency(budget.limit)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span
                      className={cn(
                        "font-bold",
                        isDanger
                          ? "text-destructive"
                          : isWarning
                            ? "text-yellow-500"
                            : "text-primary",
                      )}
                    >
                      {budget.usage.toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">
                      Sisa:{" "}
                      {formatCurrency(Math.max(budget.limit - budget.spent, 0))}
                    </span>
                  </div>
                  <Progress
                    value={budget.usage}
                    className="h-1.5 bg-secondary"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <BudgetFormDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultMonth={currentMonth}
        editing={null}
        knownLabels={knownLabels}
        onSuccess={fetchBudgets}
      />
    </PageWrapper>
  );
}
