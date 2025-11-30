"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { BankCombobox } from "./BankCombobox";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fetchData: () => void;
  editing?: {
    id: string;
    name: string;
    type: string;
    balance: number;
  } | null;
}

export function AccountBalanceFormDialog({
  isOpen,
  onOpenChange,
  fetchData,
  editing,
}: Props) {
  // Derived initial values (React 19 recommended)
  const initial = useMemo(
    () =>
      editing
        ? {
            name: editing.name,
            type: editing.type,
            balance: editing.balance,
          }
        : {
            name: "",
            type: "",
            balance: 0,
          },
    [editing]
  );

  const [name, setName] = useState(initial.name);
  const [type, setType] = useState(initial.type);
  const [balance, setBalance] = useState(initial.balance);

  // Reset state ONLY WHEN dialog opened → safe for React 19
  useEffect(() => {

    const timeoutId = setTimeout(() => {
        if (isOpen) {
            setName(initial.name);
            setType(initial.type);
            setBalance(initial.balance);
        }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [isOpen, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = { name, type, balance };

    const url = editing
      ? `/api/account-balance/${editing.id}`
      : "/api/account-balance";

    const method = editing ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    fetchData();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Akun Saldo" : "Tambah Akun Saldo"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Tipe</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="ewallet">E-Wallet</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nama Akun</Label>
            {type === "bank" ? (
              <BankCombobox value={name} onChange={setName} />
            ) : (
              <Input
                placeholder={
                  type === "ewallet"
                    ? "Contoh: GoPay, OVO, Dana"
                    : type === "cash"
                    ? "Contoh: Dompet, Kas Kecil"
                    : "Masukkan nama akun"
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Saldo</Label>
            <Input
              type="number"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" className="bg-linear-to-r from-blue-600 to-purple-600">
              {editing ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
