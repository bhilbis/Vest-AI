"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { MataKuliahData } from "@/lib/kuliah-types"

interface EditMataKuliahDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mataKuliah: MataKuliahData | null
  onSuccess: () => void
}

export function EditMataKuliahDialog({
  open,
  onOpenChange,
  mataKuliah,
  onSuccess,
}: EditMataKuliahDialogProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    kode: "",
    nama: "",
    sks: 3,
    jenis: "reguler" as "reguler" | "praktik",
  })

  // Sync form with mataKuliah when dialog opens
  useEffect(() => {
    if (mataKuliah && open) {
      setForm({
        kode: mataKuliah.kode,
        nama: mataKuliah.nama,
        sks: mataKuliah.sks,
        jenis: mataKuliah.jenis,
      })
    }
  }, [mataKuliah, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mataKuliah || !form.kode.trim() || !form.nama.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/kuliah/matkul/${mataKuliah.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Mata Kuliah</DialogTitle>
          <DialogDescription>
            Ubah data mata kuliah.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-kode-matkul" className="text-xs font-medium">
                Kode Matkul
              </Label>
              <Input
                id="edit-kode-matkul"
                placeholder="EKMA4116"
                value={form.kode}
                onChange={(e) => setForm((p) => ({ ...p, kode: e.target.value }))}
                className="h-9 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sks-matkul" className="text-xs font-medium">
                SKS
              </Label>
              <Input
                id="edit-sks-matkul"
                type="number"
                min={1}
                max={6}
                value={form.sks}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sks: Number(e.target.value) || 1 }))
                }
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-nama-matkul" className="text-xs font-medium">
              Nama Mata Kuliah
            </Label>
            <Input
              id="edit-nama-matkul"
              placeholder="Manajemen"
              value={form.nama}
              onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-jenis-matkul" className="text-xs font-medium">
              Jenis Mata Kuliah
            </Label>
            <Select
              value={form.jenis}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, jenis: v as "reguler" | "praktik" }))
              }
            >
              <SelectTrigger id="edit-jenis-matkul" className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reguler">
                  Reguler (dengan Tuweb/Tuton)
                </SelectItem>
                <SelectItem value="praktik">
                  Praktik (tanpa Tuweb)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              {form.jenis === "reguler"
                ? "UAS + Tuton (Kehadiran, Diskusi, Tugas)"
                : "Hanya Diskusi + Tugas (tanpa UAS)"}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs min-h-0"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-9 text-xs min-h-0"
              disabled={loading || !form.kode.trim() || !form.nama.trim()}
            >
              {loading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
