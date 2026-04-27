"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils"

interface Account {
  id: string
  name: string
  type: string
}

interface IncomeFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  onSuccess: () => void
  defaultDate?: string
}

export function IncomeFormDialog({
  isOpen,
  onOpenChange,
  accounts,
  onSuccess,
  defaultDate,
}: IncomeFormDialogProps) {
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split("T")[0])
  const [accountId, setAccountId] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !amount || !accountId) return

    setLoading(true)
    try {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          amount: parseFloat(amount),
          date,
          accountId,
        }),
      })

      if (!res.ok) throw new Error("Failed to create income")

      // Reset form
      setTitle("")
      setAmount("")
      setDate(defaultDate || new Date().toISOString().split("T")[0])
      setAccountId("")
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error("Error creating income:", err)
      alert("Gagal menyimpan pemasukan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Tambah Pemasukan 💰</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income-title">Judul</Label>
            <Input
              id="income-title"
              placeholder="Gaji, Bonus, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-amount">Jumlah (Rp)</Label>
            <Input
              id="income-amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formatCurrencyInput(amount)}
              onChange={(e) => setAmount(parseCurrencyInput(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-date">Tanggal</Label>
            <Input
              id="income-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="income-account">Masuk ke akun</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="income-account">
                <SelectValue placeholder="Pilih akun tujuan" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading || !title || !amount || !accountId}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
