/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
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
import { cn } from "@/lib/utils";

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
  };

  const submitTransfer = async () => {
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) {
      alert("Jumlah harus lebih dari 0.");
      return;
    }

    let fromAccountId = "";
    let toAccountId = "";

    if (mode === "transfer") {
      if (!fromId || !toId) {
        alert("Pilih akun asal dan tujuan.");
        return;
      }
      if (fromId === toId) {
        alert("Akun asal dan tujuan tidak boleh sama.");
        return;
      }
      fromAccountId = fromId;
      toAccountId = toId;
    }

    if (mode === "withdraw") {
      if (!cashAccount) {
        alert('Akun "cash" belum dibuat.');
        return;
      }
      if (!fromId) {
        alert("Pilih akun asal untuk tarik tunai.");
        return;
      }
      fromAccountId = fromId;
      toAccountId = cashAccount.id;
    }

    if (mode === "topup") {
      if (!cashAccount) {
        alert('Akun "cash" belum dibuat.');
        return;
      }
      if (!toId) {
        alert("Pilih akun tujuan untuk top up.");
        return;
      }
      fromAccountId = cashAccount.id;
      toAccountId = toId;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount: numAmount,
          note,
          mode, // info tambahan, kalau mau dipakai di API
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
      alert(err?.message || "Transfer gagal.");
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
            className={cn(
              "flex-1",
              mode === "transfer" &&
                "bg-linear-to-r from-blue-600 to-purple-600",
            )}
            onClick={() => setMode("transfer")}
          >
            Transfer
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "withdraw" ? "default" : "outline"}
            className={cn(
              "flex-1",
              mode === "withdraw" &&
                "bg-linear-to-r from-amber-500 to-orange-500",
            )}
            onClick={() => setMode("withdraw")}
          >
            Tarik Tunai
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "topup" ? "default" : "outline"}
            className={cn(
              "flex-1",
              mode === "topup" &&
                "bg-linear-to-r from-emerald-500 to-teal-500",
            )}
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
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Contoh: 100000"
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
              className="bg-linear-to-r from-blue-600 to-purple-600"
            >
              {loading ? "Memproses..." : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
