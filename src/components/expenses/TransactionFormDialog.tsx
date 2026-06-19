/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, XIcon, Loader2, TrendingDown, TrendingUp, ArrowLeftRight } from "lucide-react";
import Image from "next/image";
import { Budget } from "@/types/types";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

type TransferMode = "transfer" | "withdraw" | "topup";
type TabKey = "expense" | "income" | "transfer";

interface FormData {
  title: string;
  amount: string;
  category: string;
  description: string;
  date: string;
  photo: File | null;
  photoPreview: string | null;
  accountId: string;
  budgetId: string;
}

interface AccountData {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface TransactionFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: TabKey;
  expenseFormData: FormData;
  onExpenseFormDataChange: (data: Partial<FormData>) => void;
  onExpenseSubmit: (e: React.FormEvent) => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  categories: Array<{ value: string; label: string }>;
  accounts: AccountData[];
  budgets?: Budget[];
  onAddCategory?: () => void;
  defaultDate?: string;
  onIncomeSuccess: () => void;
  onTransferSuccess: () => void;
}

const TAB_ORDER: TabKey[] = ["expense", "income", "transfer"];

export function TransactionFormDialog({
  isOpen,
  onOpenChange,
  defaultTab = "expense",
  expenseFormData,
  onExpenseFormDataChange,
  onExpenseSubmit,
  onPhotoChange,
  onRemovePhoto,
  categories,
  accounts,
  budgets = [],
  onAddCategory,
  defaultDate,
  onIncomeSuccess,
  onTransferSuccess,
}: TransactionFormDialogProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const prevTabRef = useRef<TabKey>(defaultTab);

  const direction =
    TAB_ORDER.indexOf(activeTab) > TAB_ORDER.indexOf(prevTabRef.current) ? 1 : -1;

  const handleTabChange = (val: string) => {
    prevTabRef.current = activeTab;
    setActiveTab(val as TabKey);
  };

  const toLocalDatetime = (d: Date = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Income state
  const [incomeTitle, setIncomeTitle] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(
    defaultDate ? `${defaultDate.slice(0, 10)}T${toLocalDatetime().slice(11)}` : toLocalDatetime()
  );
  const [incomeAccountId, setIncomeAccountId] = useState("");
  const [incomeLoading, setIncomeLoading] = useState(false);

  // Transfer state
  const [transferMode, setTransferMode] = useState<TransferMode>("transfer");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [note, setNote] = useState("");
  const [hasAdminFee, setHasAdminFee] = useState(false);
  const [adminFee, setAdminFee] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  const cashAccount = useMemo(() => accounts.find((a) => a.type === "cash") || null, [accounts]);
  const digitalAccounts = useMemo(() => accounts.filter((a) => a.type !== "cash"), [accounts]);

  const formatCompact = (value: number) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);

  const resetIncomeForm = () => {
    setIncomeTitle("");
    setIncomeAmount("");
    setIncomeDate(defaultDate ? `${defaultDate.slice(0, 10)}T${toLocalDatetime().slice(11)}` : toLocalDatetime());
    setIncomeAccountId("");
  };

  const resetTransferForm = () => {
    setFromId("");
    setToId("");
    setTransferAmount("");
    setNote("");
    setHasAdminFee(false);
    setAdminFee("");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetIncomeForm();
      resetTransferForm();
    }
    onOpenChange(open);
  };

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeTitle || !incomeAmount || !incomeAccountId) return;
    setIncomeLoading(true);
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: incomeTitle,
          amount: parseFloat(incomeAmount),
          date: incomeDate,
          accountId: incomeAccountId,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      resetIncomeForm();
      onOpenChange(false);
      onIncomeSuccess();
    } catch {
      toast.error(t.financial.incomeSaveFailed);
    } finally {
      setIncomeLoading(false);
    }
  };

  const handleTransferSubmit = async () => {
    const numAmount = parseFloat(transferAmount);
    if (!numAmount || numAmount <= 0) { toast.error(t.financial.errorAmountZero); return; }

    let fromAccountId = "";
    let toAccountId = "";

    if (transferMode === "transfer") {
      if (!fromId || !toId) { toast.error(t.financial.errorSelectFromTo); return; }
      if (fromId === toId) { toast.error(t.financial.errorSameAccount); return; }
      fromAccountId = fromId; toAccountId = toId;
    }
    if (transferMode === "withdraw") {
      if (!cashAccount) { toast.error(t.financial.errorNoCash); return; }
      if (!fromId) { toast.error(t.financial.errorSelectSource); return; }
      fromAccountId = fromId; toAccountId = cashAccount.id;
    }
    if (transferMode === "topup") {
      if (!cashAccount) { toast.error(t.financial.errorNoCash); return; }
      if (!toId) { toast.error(t.financial.errorSelectDest); return; }
      fromAccountId = cashAccount.id; toAccountId = toId;
    }

    try {
      setTransferLoading(true);
      const numAdminFee = hasAdminFee && adminFee ? parseFloat(adminFee) : 0;
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromAccountId, toAccountId, amount: numAmount, note, mode: transferMode, adminFee: numAdminFee }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || t.financial.transferSaveFailed);
      }
      resetTransferForm();
      onOpenChange(false);
      onTransferSuccess();
    } catch (err: any) {
      toast.error(err?.message || t.financial.transferSaveFailed);
    } finally {
      setTransferLoading(false);
    }
  };

  const transferModeTitle =
    transferMode === "transfer" ? t.financial.transferTitleTransfer
    : transferMode === "withdraw" ? t.financial.transferTitleWithdraw
    : t.financial.transferTitleTopup;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{t.financial.addTransaction}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Tab list — custom edge-to-edge active style for first/last */}
          <TabsList className="w-full p-0.5 gap-0">
            <TabsTrigger
              value="expense"
              className="flex-1 gap-1.5 rounded-[5px] rounded-r-sm data-[state=active]:rounded-[5px] data-[state=active]:rounded-r-sm"
            >
              <TrendingDown size={14} /> {t.financial.expenses}
            </TabsTrigger>
            <TabsTrigger
              value="income"
              className="flex-1 gap-1.5 rounded-sm data-[state=active]:rounded-sm"
            >
              <TrendingUp size={14} /> {t.financial.income}
            </TabsTrigger>
            <TabsTrigger
              value="transfer"
              className="flex-1 gap-1.5 rounded-sm rounded-r-[5px] data-[state=active]:rounded-sm data-[state=active]:rounded-r-[5px]"
            >
              <ArrowLeftRight size={14} /> {t.financial.transfer}
            </TabsTrigger>
          </TabsList>

          {/* Animated tab content */}
          <div className="relative overflow-hidden mt-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -direction * 24 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* ===== EXPENSE ===== */}
                {activeTab === "expense" && (
                  <form onSubmit={onExpenseSubmit} className="space-y-4 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>{t.financial.labelTitle} *</Label>
                        <Input
                          className="h-11"
                          value={expenseFormData.title}
                          onChange={(e) => onExpenseFormDataChange({ title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t.financial.labelAmount} *</Label>
                        <Input
                          className="h-11"
                          type="text"
                          inputMode="numeric"
                          value={formatCurrencyInput(expenseFormData.amount)}
                          onChange={(e) => onExpenseFormDataChange({ amount: parseCurrencyInput(e.target.value) })}
                          placeholder="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t.financial.labelDate} *</Label>
                      <Input
                        className="h-11"
                        type="datetime-local"
                        value={expenseFormData.date}
                        onChange={(e) => onExpenseFormDataChange({ date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label>{t.financial.labelCategory}</Label>
                        {onAddCategory && (
                          <Button type="button" variant="ghost" size="sm" className="h-7 min-h-0 gap-1 px-2 text-xs" onClick={onAddCategory}>
                            <PlusIcon className="h-3 w-3" /> {t.common.add}
                          </Button>
                        )}
                      </div>
                      <Select value={expenseFormData.category} onValueChange={(v) => onExpenseFormDataChange({ category: v })}>
                        <SelectTrigger className="h-11 w-full">
                          <SelectValue placeholder={t.financial.placeholderSelectCategory} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t.financial.labelSourceAccount} *</Label>
                      <Select value={expenseFormData.accountId} onValueChange={(v) => onExpenseFormDataChange({ accountId: v })}>
                        <SelectTrigger className="h-11 w-full">
                          <SelectValue placeholder={t.financial.placeholderSelectSourceAccount} />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.name} — Rp {acc.balance.toLocaleString()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t.financial.labelAssignBudget}</Label>
                      <Select value={expenseFormData.budgetId} onValueChange={(v) => onExpenseFormDataChange({ budgetId: v })}>
                        <SelectTrigger className="h-11 w-full">
                          <SelectValue placeholder={t.financial.placeholderNoBudget} />
                        </SelectTrigger>
                        <SelectContent>
                          {budgets.map((budget) => (
                            <SelectItem key={budget.id} value={budget.id}>
                              {budget.name} — Rp {formatCompact(budget.limit)}
                              {typeof budget.spent === "number" && (
                                <span className="text-muted-foreground text-xs ml-1">
                                  ({t.financial.budgetRemaining} Rp {formatCompact(Math.max(budget.limit - (budget.spent ?? 0), 0))})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t.financial.labelDescription}</Label>
                      <Textarea rows={2} value={expenseFormData.description} onChange={(e) => onExpenseFormDataChange({ description: e.target.value })} />
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t.financial.labelPhoto}</Label>
                      <Input className="h-11" type="file" accept="image/*" onChange={onPhotoChange} />
                      {expenseFormData.photoPreview && (
                        <div className="relative w-28 h-28 rounded-lg overflow-hidden border">
                          <Image src={expenseFormData.photoPreview} alt="preview" fill className="object-cover" unoptimized />
                          <Button type="button" variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0" onClick={onRemovePhoto}>
                            <XIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
                      <Button type="submit">{t.common.save}</Button>
                    </div>
                  </form>
                )}

                {/* ===== INCOME ===== */}
                {activeTab === "income" && (
                  <form onSubmit={handleIncomeSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <Label>{t.financial.labelTitle}</Label>
                      <Input
                        className="h-11"
                        placeholder="Gaji, Bonus..."
                        value={incomeTitle}
                        onChange={(e) => setIncomeTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.financial.labelAmount}</Label>
                      <Input
                        className="h-11"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={formatCurrencyInput(incomeAmount)}
                        onChange={(e) => setIncomeAmount(parseCurrencyInput(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.financial.labelDate}</Label>
                      <Input
                        className="h-11"
                        type="datetime-local"
                        value={incomeDate}
                        onChange={(e) => setIncomeDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t.financial.labelDestinationAccount}</Label>
                      <Select value={incomeAccountId} onValueChange={setIncomeAccountId}>
                        <SelectTrigger className="h-11 w-full">
                          <SelectValue placeholder={t.financial.placeholderSelectAccount} />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((acc) => (
                            <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.type})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={incomeLoading}>{t.common.cancel}</Button>
                      <Button type="submit" disabled={incomeLoading || !incomeTitle || !incomeAmount || !incomeAccountId}>
                        {incomeLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {t.common.save}
                      </Button>
                    </div>
                  </form>
                )}

                {/* ===== TRANSFER ===== */}
                {activeTab === "transfer" && (
                  <div className="space-y-4 pt-1">
                    <p className="text-xs text-muted-foreground">{transferModeTitle}</p>

                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant={transferMode === "transfer" ? "default" : "outline"} className="flex-1 h-10" onClick={() => setTransferMode("transfer")}>
                        {t.financial.transferModeTransfer}
                      </Button>
                      <Button type="button" size="sm" variant={transferMode === "withdraw" ? "default" : "outline"} className="flex-1 h-10" onClick={() => setTransferMode("withdraw")}>
                        {t.financial.transferModeWithdraw}
                      </Button>
                      <Button type="button" size="sm" variant={transferMode === "topup" ? "default" : "outline"} className="flex-1 h-10" onClick={() => setTransferMode("topup")}>
                        {t.financial.transferModeTopup}
                      </Button>
                    </div>

                    {/* From Account */}
                    {transferMode === "topup" ? (
                      cashAccount ? (
                        <div className="space-y-1.5">
                          <Label>{t.financial.labelFromAccount}</Label>
                          <p className="text-sm py-2.5 px-3 rounded-md border border-input bg-muted/30">{cashAccount.name} — Rp {cashAccount.balance.toLocaleString()}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-destructive">{t.financial.errorNoCash}</p>
                      )
                    ) : (
                      <div className="space-y-1.5">
                        <Label>{t.financial.labelFromAccount}</Label>
                        <Select value={fromId} onValueChange={setFromId}>
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder={t.financial.placeholderSelectSourceAccount} />
                          </SelectTrigger>
                          <SelectContent>
                            {digitalAccounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>{acc.name} — Rp {acc.balance.toLocaleString()}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* To Account */}
                    {transferMode === "withdraw" ? (
                      cashAccount ? (
                        <div className="space-y-1.5">
                          <Label>{t.financial.labelToAccount}</Label>
                          <p className="text-sm py-2.5 px-3 rounded-md border border-input bg-muted/30">{cashAccount.name} — Rp {cashAccount.balance.toLocaleString()}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-destructive">{t.financial.errorNoCash}</p>
                      )
                    ) : (
                      <div className="space-y-1.5">
                        <Label>{t.financial.labelToAccount}</Label>
                        <Select value={toId} onValueChange={setToId}>
                          <SelectTrigger className="h-11 w-full">
                            <SelectValue placeholder={t.financial.placeholderSelectAccount} />
                          </SelectTrigger>
                          <SelectContent>
                            {(transferMode === "transfer" ? digitalAccounts.filter((a) => a.id !== fromId) : digitalAccounts).map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>{acc.name} — Rp {acc.balance.toLocaleString()}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label>{t.financial.labelAmount}</Label>
                      <Input
                        className="h-11"
                        type="text"
                        inputMode="numeric"
                        value={formatCurrencyInput(transferAmount)}
                        onChange={(e) => setTransferAmount(parseCurrencyInput(e.target.value))}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t.financial.labelNote}</Label>
                      <Input
                        className="h-11"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t.financial.placeholderNote}
                      />
                    </div>

                    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => { setHasAdminFee(!hasAdminFee); if (hasAdminFee) setAdminFee(""); }}
                        className="flex w-full items-center justify-between gap-3 cursor-pointer"
                      >
                        <span className="text-sm text-foreground">{t.financial.labelAdminFee}</span>
                        <div className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${hasAdminFee ? "bg-primary" : "bg-muted-foreground/30"}`}>
                          <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${hasAdminFee ? "translate-x-4" : "translate-x-0.5"}`} />
                        </div>
                      </button>
                      {hasAdminFee && (
                        <div className="mt-2.5 pt-2.5 border-t border-border space-y-1.5">
                          <Input
                            className="h-10 text-sm"
                            type="text"
                            inputMode="numeric"
                            value={formatCurrencyInput(adminFee)}
                            onChange={(e) => setAdminFee(parseCurrencyInput(e.target.value))}
                            placeholder="2.500"
                            autoFocus
                          />
                          <p className="text-xs text-muted-foreground">{t.financial.adminFeeNote}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
                      <Button type="button" onClick={handleTransferSubmit} disabled={transferLoading}>
                        {transferLoading ? t.financial.processing : t.common.save}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
