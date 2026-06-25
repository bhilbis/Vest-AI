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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

const EMOJI_OPTIONS = ["🎯", "🏠", "🚗", "✈️", "💍", "📱", "💻", "🎓", "💊", "🐾", "🌴", "💰"];

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  deadline: string | null;
  icon: string | null;
  notes: string | null;
}

interface SavingsFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editing?: SavingsGoal | null;
}

export function SavingsFormDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  editing,
}: SavingsFormDialogProps) {
  const { t } = useLanguage();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("0");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [monthlyContribution, setMonthlyContribution] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(editing?.name ?? "");
    setTargetAmount(editing ? String(editing.targetAmount) : "0");
    setCurrentAmount(editing ? String(editing.currentAmount) : "0");
    setMonthlyContribution(editing ? String(editing.monthlyContribution) : "0");
    setDeadline(editing?.deadline ? editing.deadline.slice(0, 10) : "");
    setIcon(editing?.icon ?? "🎯");
    setNotes(editing?.notes ?? "");
    setError(null);
  }, [isOpen, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount),
        monthlyContribution: Number(monthlyContribution),
        deadline: deadline || null,
        icon: icon || null,
        notes: notes || null,
      };

      const url = editing ? `/api/savings/${editing.id}` : "/api/savings";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? t.common.edit + " " + t.financial.savingsGoal : t.financial.savingsAddNew}
          </DialogTitle>
          <DialogDescription>{t.financial.savingsDesc}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Icon picker */}
          <div className="space-y-2">
            <Label>{t.financial.savingsIcon}</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(em)}
                  className={`text-xl w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    icon === em
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>{t.financial.savingsNameLabel} *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.financial.savingsNamePlaceholder}
              required
            />
          </div>

          {/* Target & Current */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.financial.savingsTargetLabel} *</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatCurrencyInput(targetAmount)}
                onChange={(e) => setTargetAmount(parseCurrencyInput(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t.financial.savingsCurrentLabel}</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatCurrencyInput(currentAmount)}
                onChange={(e) => setCurrentAmount(parseCurrencyInput(e.target.value))}
              />
            </div>
          </div>

          {/* Monthly contribution & deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.financial.savingsMonthlyLabel}</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatCurrencyInput(monthlyContribution)}
                onChange={(e) => setMonthlyContribution(parseCurrencyInput(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.financial.savingsDeadlineLabel}</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t.financial.budgetNotesLabel}</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.financial.savingsNotesPlaceholder}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t.financial.saving : t.common.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
