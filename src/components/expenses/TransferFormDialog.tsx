/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils";

type TransferMode = "transfer" | "withdraw" | "topup";

interface AccountBalance {
  id: string;
  name: string;
  type: string; // "bank" | "ewallet" | "cash"
  balance: number;
}

interface TransferFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountBalance[];
  onSuccess: () => void; // dipanggil setelah transfer sukses (buat refresh saldo)
}

export function TransferFormDialog({
  isOpen,
  onOpenChange,
  accounts,
  onSuccess,
}: TransferFormDialogProps) {
  const [mode, setMode] = useState<TransferMode>("transfer");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [hasAdminFee, setHasAdminFee] = useState(false);
  const [adminFee, setAdminFee] = useState("");
  const [loading, setLoading] = useState(false);

  const cashAccount = useMemo(
    () => accounts.find((a) => a.type === "cash") || null,
    [accounts],
  );

  const digitalAccounts = useMemo(
    () => accounts.filter((a) => a.type !== "cash"),
    [accounts],
  );

  const resetForm = () => {
    setFromId("");
    setToId("");
    setAmount("");
    setNote("");
    setHasAdminFee(false);
    setAdminFee("");
  };

  const submitTransfer = async () => {
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      toast.error("Jumlah harus lebih dari 0.");
      return;
    }

    let fromAccountId = "";
    let toAccountId = "";

    if (mode === "transfer") {
      if (!fromId || !toId) {
        toast.error("Pilih akun asal dan tujuan.");
        return;
      }
      if (fromId === toId) {
        toast.error("Akun asal dan tujuan tidak boleh sama.");
        return;
      }
      fromAccountId = fromId;
      toAccountId = toId;
    }

    if (mode === "withdraw") {
      if (!cashAccount) {
        toast.error('Akun "cash" belum dibuat.');
        return;
      }
      if (!fromId) {
        toast.error("Pilih akun asal untuk tarik tunai.");
        return;
      }
      fromAccountId = fromId;
      toAccountId = cashAccount.id;
    }

    if (mode === "topup") {
      if (!cashAccount) {
        toast.error('Akun "cash" belum dibuat.');
        return;
      }
      if (!toId) {
        toast.error("Pilih akun tujuan untuk top up.");
        return;
      }
      fromAccountId = cashAccount.id;
      toAccountId = toId;
    }

    try {
      setLoading(true);

      const numAdminFee = hasAdminFee && adminFee ? parseFloat(adminFee) : 0;

      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount: numAmount,
          note,
          mode,
          adminFee: numAdminFee,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Transfer gagal.");
      }

      onSuccess();
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Transfer gagal.");
    } finally {
      setLoading(false);
    }
  };

  const renderFromSelect = () => {
    if (mode === "topup") {
      // cash → digital (cash fixed, tidak dipilih)
      if (!cashAccount) {
        return (
          <p className="text-sm text-red-500">
            Akun <strong>cash</strong> belum ada. Tambahkan dulu di Akun Saldo.
          </p>
        );
      }

      return (
        <div className="space-y-1">
          <Label>Dari Akun</Label>
          <p className="text-sm">
            {cashAccount.name} — Rp {cashAccount.balance.toLocaleString()}
          </p>
        </div>
      );
    }

    if (mode === "withdraw") {
      // digital → cash (pilih sumbernya, tujuan auto cash)
      return (
        <div className="space-y-2">
          <Label>Dari Akun</Label>
          <Select value={fromId} onValueChange={setFromId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih akun asal (bank / ewallet)" />
            </SelectTrigger>
            <SelectContent>
              {digitalAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name} — Rp {acc.balance.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // mode === "transfer": digital → digital
    return (
      <div className="space-y-2">
        <Label>Dari Akun</Label>
        <Select value={fromId} onValueChange={setFromId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih akun asal" />
          </SelectTrigger>
          <SelectContent>
            {digitalAccounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name} — Rp {acc.balance.toLocaleString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderToSelect = () => {
    if (mode === "withdraw") {
      if (!cashAccount) {
        return (
          <p className="text-sm text-red-500">
            Akun <strong>cash</strong> belum ada. Tambahkan dulu di Akun Saldo.
          </p>
        );
      }

      return (
        <div className="space-y-1">
          <Label>Ke Akun</Label>
          <p className="text-sm">
            {cashAccount.name} — Rp {cashAccount.balance.toLocaleString()}
          </p>
        </div>
      );
    }

    if (mode === "topup") {
      // cash → digital (pilih tujuan)
      return (
        <div className="space-y-2">
          <Label>Ke Akun</Label>
          <Select value={toId} onValueChange={setToId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih akun tujuan (bank / ewallet)" />
            </SelectTrigger>
            <SelectContent>
              {digitalAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name} — Rp {acc.balance.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // mode === "transfer": digital → digital
    return (
      <div className="space-y-2">
        <Label>Ke Akun</Label>
        <Select value={toId} onValueChange={setToId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih akun tujuan" />
          </SelectTrigger>
          <SelectContent>
            {digitalAccounts
              .filter((acc) => acc.id !== fromId)
              .map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name} — Rp {acc.balance.toLocaleString()}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const modeTitle =
    mode === "transfer"
      ? "Transfer Antar Akun"
      : mode === "withdraw"
      ? "Tarik Tunai (Bank/Ewallet → Cash)"
      : "Top Up / Setor Tunai (Cash → Bank/Ewallet)";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {modeTitle}
          </DialogTitle>
        </DialogHeader>

        {/* mode selector */}
        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            size="sm"
            variant={mode === "transfer" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setMode("transfer")}
          >
            Transfer
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "withdraw" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setMode("withdraw")}
          >
            Tarik Tunai
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "topup" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setMode("topup")}
          >
            Top Up
          </Button>
        </div>

        <div className="space-y-4">
          {/* From */}
          {renderFromSelect()}

          {/* To */}
          {renderToSelect()}

          {/* Amount */}
          <div className="space-y-2">
            <Label>Jumlah</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatCurrencyInput(amount)}
              onChange={(e) => setAmount(parseCurrencyInput(e.target.value))}
              placeholder="Contoh: 100,000"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>Catatan (opsional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                mode === "withdraw"
                  ? "Contoh: Tarik tunai ke dompet"
                  : mode === "topup"
                  ? "Contoh: Setor tunai ke BCA"
                  : "Contoh: Pindah saldo"
              }
            />
          </div>

          {/* Admin Fee */}
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <button
              type="button"
              onClick={() => {
                setHasAdminFee(!hasAdminFee);
                if (hasAdminFee) setAdminFee("");
              }}
              className="flex w-full items-center justify-between gap-3 cursor-pointer"
            >
              <span className="text-sm text-foreground">Biaya admin</span>
              <div
                className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
                  hasAdminFee ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    hasAdminFee ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>
            {hasAdminFee && (
              <div className="mt-2.5 pt-2.5 border-t border-border space-y-1.5">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrencyInput(adminFee)}
                  onChange={(e) => setAdminFee(parseCurrencyInput(e.target.value))}
                  placeholder="Contoh: 2.500"
                  className="h-8 text-sm"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Tercatat sebagai pengeluaran terpisah
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={submitTransfer}
              disabled={loading}
            >
              {loading ? "Memproses..." : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
