"use client";

import { useState, useEffect, useCallback } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { formatCurrency } from "@/lib/expenseUtils";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SavingsFormDialog, type SavingsGoal } from "@/components/savings/SavingsFormDialog";
import { SavingsContributeDialog } from "@/components/savings/SavingsContributeDialog";
import { useConfirmStore } from "@/lib/confirm-store";
import { useLanguage } from "@/lib/i18n/context";

export default function SavingsPage() {
  const { t } = useLanguage();
  const { openConfirm } = useConfirmStore();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/savings");
      if (!res.ok) return;
      setGoals(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleDelete = async (id: string) => {
    const ok = await openConfirm({ title: t.financial.savingsDeleteConfirm, confirmLabel: t.common.delete, variant: "destructive" });
    if (!ok) return;
    await fetch(`/api/savings/${id}`, { method: "DELETE" });
    await fetchGoals();
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalPct = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  return (
    <PageWrapper maxWidth="lg" className="space-y-6">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.financial.savingsGoals}</h1>
          <p className="text-sm text-muted-foreground">{t.financial.savingsDesc}</p>
        </div>
        <Button onClick={() => { setEditingGoal(null); setFormOpen(true); }} className="self-start sm:self-auto">
          <Plus size={16} className="mr-1.5" />
          {t.financial.savingsAddNew}
        </Button>
      </header>

      {/* Summary */}
      {!loading && goals.length > 0 && (
        <div className="rounded-xl shadow-xs border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-semibold">{t.financial.savingsProgress}</p>
          <div className="flex items-end justify-between mb-2">
            <p className={cn("text-3xl font-bold tabular-nums tracking-tight", totalPct >= 100 ? "text-green-500" : "text-primary")}>
              {totalPct.toFixed(1)}%
            </p>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t.financial.savingsCurrentLabel}</p>
              <p className="text-sm font-semibold text-foreground">{formatCurrency(totalSaved)}</p>
            </div>
          </div>
          <Progress value={totalPct} className="h-2 bg-secondary" />
          <p className="text-xs text-muted-foreground mt-2">
            {t.financial.savingsOf} {formatCurrency(totalTarget)}
          </p>
        </div>
      )}

      {/* Goals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 animate-pulse h-44" />
          ))
        ) : goals.length === 0 ? (
          <div className="col-span-full rounded-xl shadow-xs border border-border bg-card p-12 text-center">
            <PiggyBank className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-base font-medium text-foreground">{t.financial.savingsNoGoals}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{t.financial.savingsDesc}</p>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
              <Plus size={14} className="mr-1.5" /> {t.financial.savingsCreateFirst}
            </Button>
          </div>
        ) : (
          goals.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
            const monthsLeft = goal.monthlyContribution > 0 ? Math.ceil(remaining / goal.monthlyContribution) : null;
            const isComplete = goal.currentAmount >= goal.targetAmount;

            return (
              <div key={goal.id} className="group rounded-xl shadow-xs border border-border bg-card p-5 hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{goal.icon || "🎯"}</span>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-foreground truncate">{goal.name}</p>
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Target: {new Date(goal.deadline).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" title="More" className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity shrink-0">
                        <MoreHorizontal size={15} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => { setContributeGoal(goal); setContributeOpen(true); }}>
                        <Plus size={12} /> {t.financial.savingsAddContribution}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => { setEditingGoal(goal); setFormOpen(true); }}>
                        <Edit size={12} /> {t.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDelete(goal.id)}>
                        <Trash2 size={12} /> {t.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.financial.savingsCurrentLabel}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(goal.currentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.financial.savingsTargetLabel}</span>
                    <span className="font-medium text-muted-foreground">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  {goal.monthlyContribution > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t.financial.savingsMonthlyLabel}</span>
                      <span className="font-medium text-muted-foreground">{formatCurrency(goal.monthlyContribution)}/bln</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className={cn("font-bold", isComplete ? "text-green-500" : "text-primary")}>
                      {isComplete ? `✓ ${t.financial.savingsCompleted}` : `${pct.toFixed(1)}%`}
                    </span>
                    {!isComplete && (
                      <span className="text-muted-foreground">
                        {monthsLeft != null
                          ? `${t.financial.savingsEstimated} ${monthsLeft} ${t.financial.savingsMonths}`
                          : `${t.financial.savingsOf} ${formatCurrency(goal.targetAmount)}`}
                      </span>
                    )}
                  </div>
                  <Progress value={pct} className={cn("h-1.5", isComplete ? "bg-green-500/20" : "bg-secondary")} />
                </div>

                {goal.notes && (
                  <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-3 line-clamp-2">{goal.notes}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      <SavingsFormDialog
        isOpen={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingGoal(null); }}
        onSuccess={fetchGoals}
        editing={editingGoal}
      />
      <SavingsContributeDialog
        isOpen={contributeOpen}
        onOpenChange={(open) => { setContributeOpen(open); if (!open) setContributeGoal(null); }}
        onSuccess={fetchGoals}
        goal={contributeGoal}
      />
    </PageWrapper>
  );
}
