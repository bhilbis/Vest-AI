import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PlusIcon, XIcon } from 'lucide-react';
import Image from 'next/image';

interface FormData {
  title: string;
  amount: string;
  category: string;
  description: string;
  date: string;
  photo: File | null;
  photoPreview: string | null;
  accountId: string;
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
  accounts: Array<{ id: string; name: string; balance: number }>;
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
  existingPhotoUrl,
}: ExpenseFormDialogProps) {
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
            {isEditing ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
          </DialogTitle>
          <DialogDescription>
            Tambahkan detail pengeluaran Anda beserta foto jika diperlukan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">

          {/* Title + Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul *</Label>
              <Input 
                id="title"
                value={formData.title}
                onChange={(e) => onFormDataChange({ title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (Rp) *</Label>
              <Input
                id="amount"
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
                onValueChange={(v) => onFormDataChange({ category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => onFormDataChange({ date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Source / Account */}
          <div className="space-y-2">
            <Label>Sumber Dana *</Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) => onFormDataChange({ accountId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} — Rp {acc.balance.toLocaleString('id-ID')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => onFormDataChange({ description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Photo */}
          <div className="space-y-2">
            <Label>Foto</Label>
            <Input type="file" accept="image/*" onChange={onPhotoChange} />

            {formData.photoPreview && (
              <div className="relative w-32 h-32 mt-2 rounded-lg overflow-hidden border">
                <Image 
                  src={formData.photoPreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  type="button"
                  onClick={onRemovePhoto}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            )}

            {isEditing && existingPhotoUrl && !formData.photoPreview && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                <Image 
                  src={existingPhotoUrl}
                  alt="Existing"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit">
              {isEditing ? 'Update' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}