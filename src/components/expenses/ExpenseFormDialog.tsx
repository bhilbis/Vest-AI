"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { Budget } from "@/types/types";

interface FormData {
  title: string;
  amount: string;
  category: string;
  description: string;
  date: string;
  photo: File | null;
  photoPreview: string | null;
  accountId: string; // 🔥 NEW
  budgetId: string;
}

interface AccountData {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface ExpenseFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  onFormDataChange: (data: Partial<FormData>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: () => void;
  isEditing: boolean;
  categories: Array<{ value: string; label: string }>;
  accounts: AccountData[]; // 🔥 NEW
  budgets?: Budget[];
  existingPhotoUrl?: string | null;
}

export function ExpenseFormDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  onPhotoChange,
  onRemovePhoto,
  isEditing,
  categories,
  accounts,
  budgets = [],
  existingPhotoUrl,
}: ExpenseFormDialogProps) {
  const formatCompactCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
          <PlusIcon className="h-4 w-4" />
          Tambah Pengeluaran
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditing ? "Edit Pengeluaran" : "Tambah Pengeluaran Baru"}
          </DialogTitle>
          <DialogDescription>
            Tambahkan detail pengeluaran Anda beserta foto jika diperlukan
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Judul + Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Judul *</Label>
              <Input
                value={formData.title}
                onChange={(e) => onFormDataChange({ title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Jumlah (Rp) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => onFormDataChange({ amount: e.target.value })}
                required
                min="0"
              />
            </div>
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => onFormDataChange({ category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => onFormDataChange({ date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Sumber Dana / Account */}
          <div className="space-y-2">
            <Label>Sumber Dana *</Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) => onFormDataChange({ accountId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun sumber dana" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} — Rp {acc.balance.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label>Anggarkan ke Budget</Label>
            <Select
              value={formData.budgetId}
              onValueChange={(value) => onFormDataChange({ budgetId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tidak menggunakan budget" />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.name} — Rp {formatCompactCurrency(budget.limit)}
                    {typeof budget.spent === "number" && (
                      <span className="text-muted-foreground text-xs ml-1">
                        (Sisa Rp {formatCompactCurrency(Math.max(budget.limit - (budget.spent ?? 0), 0))})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea
              rows={3}
              value={formData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
            />
          </div>

          {/* Photo */}
          <div className="space-y-2">
            <Label>Foto</Label>
            <Input type="file" accept="image/*" onChange={onPhotoChange} />

            {formData.photoPreview && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden mt-2 border">
                <Image
                  src={formData.photoPreview}
                  alt="preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-7 w-7 p-0"
                  onClick={onRemovePhoto}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isEditing && existingPhotoUrl && !formData.photoPreview && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden mt-2 border">
                <Image
                  src={existingPhotoUrl}
                  alt="photo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button className="bg-linear-to-r from-blue-600 to-purple-600">
              {isEditing ? "Update" : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}