"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { useConfirmStore } from "@/lib/confirm-store";

const DEFAULT_LABELS = [
  "Makanan",
  "Transport",
  "Hiburan",
  "Belanja",
  "Kesehatan",
  "Pendidikan",
  "Tagihan",
  "Tabungan",
  "Lainnya",
];

interface BudgetFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultMonth: string;
  knownLabels?: string[];
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
  knownLabels = [],
  editing,
}: BudgetFormDialogProps) {
  const { openConfirm } = useConfirmStore();

  const [name, setName] = useState("");
  const [limit, setLimit] = useState("0");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState(defaultMonth);
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Label combobox state
  const [labelOpen, setLabelOpen] = useState(false);
  const [labelSearch, setLabelSearch] = useState("");

  const allLabels = useMemo(() => {
    return [...new Set([...DEFAULT_LABELS, ...knownLabels])];
  }, [knownLabels]);

  const filteredLabels = useMemo(
    () =>
      allLabels.filter((l) =>
        l.toLowerCase().includes(labelSearch.toLowerCase())
      ),
    [allLabels, labelSearch]
  );

  const hasExactMatch = useMemo(
    () =>
      allLabels.some(
        (l) => l.toLowerCase() === labelSearch.trim().toLowerCase()
      ),
    [allLabels, labelSearch]
  );

  useEffect(() => {
    if (!isOpen) return;
    setName(editing?.name ?? "");
    setLimit(editing ? String(editing.limit) : "0");
    setCategory(editing?.category ?? "");
    const derivedMonth = editing?.monthKey ?? defaultMonth;
    setMonth(formatMonthKey(derivedMonth));
    setNotes(editing?.notes ?? "");
    setIsRecurring(false);
    setLabelOpen(false);
    setLabelSearch("");
    setError(null);
  }, [isOpen, editing, defaultMonth]);

  const handleAddLabel = async () => {
    const label = labelSearch.trim();
    if (!label) return;
    setLabelOpen(false);
    const ok = await openConfirm({
      title: `Tambahkan label "${label}"?`,
      confirmLabel: "Tambahkan",
    });
    if (ok) {
      setCategory(label);
      setLabelSearch("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name,
        limit: Number(limit),
        category: category || null,
        month: isRecurring ? defaultMonth : month,
        notes: notes || null,
        ...(editing ? {} : { isRecurring }),
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal menyimpan budget";
      setError(message);
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
            Tetapkan limit bulanan untuk kategori pengeluaran tertentu agar
            tetap terkontrol.
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

          <div
            className={cn(
              "grid gap-4",
              !isRecurring ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            )}
          >
            <div className="space-y-2">
              <Label>Limit (Rp) *</Label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatCurrencyInput(limit)}
                onChange={(e) => setLimit(parseCurrencyInput(e.target.value))}
                required
              />
            </div>

            {!isRecurring && (
              <div className="space-y-2">
                <Label>Bulan *</Label>
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Category / Label combobox */}
          <div className="space-y-2">
            <Label>Kategori / Label</Label>
            <Popover open={labelOpen} onOpenChange={setLabelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={labelOpen ? "true" : "false"}
                  aria-controls="label-listbox"
                  aria-label="Pilih kategori / label"
                  title="Pilih kategori / label"
                  className={cn(
                    "w-full flex items-center justify-between h-9 px-3 rounded-md text-sm",
                    "border-2 border-foreground bg-background transition-all",
                    "shadow-[2px_2px_0_var(--foreground)]",
                    "focus:outline-none focus-visible:outline-2 focus-visible:outline-ring",
                    !category && "text-muted-foreground"
                  )}
                >
                  <span className="truncate">
                    {category || "Pilih atau ketik label..."}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {category && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategory("");
                          setLabelSearch("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            setCategory("");
                            setLabelSearch("");
                          }
                        }}
                        className="rounded-sm p-0.5 hover:bg-muted-foreground/20 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 overflow-hidden"
                style={{ width: "var(--radix-popover-trigger-width)" }}
                align="start"
              >
                <Command shouldFilter={false} className="border-0 shadow-none">
                  <CommandInput
                    placeholder="Cari atau ketik label baru..."
                    value={labelSearch}
                    onValueChange={setLabelSearch}
                  />
                  <CommandList>
                    {filteredLabels.length === 0 && !labelSearch.trim() && (
                      <CommandEmpty>Belum ada label.</CommandEmpty>
                    )}
                    {filteredLabels.length > 0 && (
                      <CommandGroup>
                        {filteredLabels.map((l) => (
                          <CommandItem
                            key={l}
                            value={l}
                            onSelect={() => {
                              setCategory(l);
                              setLabelSearch("");
                              setLabelOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                category === l ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {l}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {labelSearch.trim() && !hasExactMatch && (
                      <CommandGroup>
                        <CommandItem
                          value={`__new__${labelSearch}`}
                          onSelect={handleAddLabel}
                        >
                          <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-primary">
                            Tambahkan &quot;{labelSearch.trim()}&quot;
                          </span>
                        </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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

          {!editing && (
            <div className="space-y-2">
              <Label>Frekuensi</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecurring(false)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    !isRecurring
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  Sekali (bulan ini)
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecurring(true)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    isRecurring
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  Tiap Bulan (rutin)
                </button>
              </div>
              {isRecurring && (
                <p className="text-xs text-muted-foreground">
                  Budget akan dibuat otomatis untuk 12 bulan ke depan mulai dari bulan ini.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

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
