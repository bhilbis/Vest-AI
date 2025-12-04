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

interface BudgetFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultMonth: string;
  editing?: {
    id: string;
    name: string;
    limit: number;
    category: string | null;
    notes: string | null;
    monthKey?: string;
  } | null;
}

const formatMonthKey = (value?: string | null) => {
  if (!value) return "";
  if (value.length >= 7) return value.slice(0, 7);
  return value;
};

export function BudgetFormDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  defaultMonth,
  editing,
}: BudgetFormDialogProps) {
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("0");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState(defaultMonth);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(editing?.name ?? "");
    setLimit(editing ? String(editing.limit) : "0");
    setCategory(editing?.category ?? "");
    const derivedMonth = editing?.monthKey ?? defaultMonth;
    setMonth(formatMonthKey(derivedMonth));
    setNotes(editing?.notes ?? "");
    setError(null);
  }, [isOpen, editing, defaultMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name,
        limit: Number(limit),
        category: category || null,
        month,
        notes: notes || null,
      };

      const url = editing ? `/api/budgets/${editing.id}` : "/api/budgets";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gagal menyimpan budget");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Budget" : "Set Budget Baru"}</DialogTitle>
          <DialogDescription>
            Tetapkan limit bulanan untuk kategori pengeluaran tertentu agar tetap terkontrol.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Nama Budget *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kebutuhan Pokok"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Limit (Rp) *</Label>
              <Input
                type="number"
                min={0}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Bulan *</Label>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kategori / Label</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Contoh: Jajan, Transport, dll"
            />
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail tambahan untuk budget ini"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : editing ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
