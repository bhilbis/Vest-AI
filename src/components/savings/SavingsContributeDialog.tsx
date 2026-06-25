"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";
import type { SavingsGoal } from "./SavingsFormDialog";

interface SavingsContributeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  goal: SavingsGoal | null;
}

export function SavingsContributeDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  goal,
}: SavingsContributeDialogProps) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAmount(goal?.monthlyContribution ? String(goal.monthlyContribution) : "0");
    setNote("");
    setError(null);
  }, [isOpen, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/savings/${goal.id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), note: note || null }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || t.financial.savingsSaveFailed);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.financial.savingsSaveFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.financial.savingsAddContribution}</DialogTitle>
          <DialogDescription>
            {goal?.icon} {goal?.name}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>{t.financial.labelAmount} *</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatCurrencyInput(amount)}
              onChange={(e) => setAmount(parseCurrencyInput(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t.financial.labelNote}</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.financial.savingsContributionNotePlaceholder}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t.financial.saving : t.financial.savingsContributeBtn}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
