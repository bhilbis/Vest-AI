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
import { Loader2, X, FileText, Video } from "lucide-react"
import { MataKuliahData } from "@/lib/kuliah-types"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/context"

interface AddMataKuliahDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  semesterId: string
  onSuccess: (mk: MataKuliahData) => void
}

const JENIS_DEFAULTS: Record<string, { jumlahSesi: number; tugaSesiNumbers: number[] }> = {
  reguler: { jumlahSesi: 8,  tugaSesiNumbers: [3, 5, 7] },
  praktik: { jumlahSesi: 8,  tugaSesiNumbers: [3, 5, 7] },
  tuweb:   { jumlahSesi: 15, tugaSesiNumbers: [4, 8, 12] },
}

interface FormState {
  kode: string
  nama: string
  sks: number
  jenis: "reguler" | "praktik" | "tuweb"
  jumlahSesi: number
  tugaSesiNumbers: number[]
  zoomSesiNumbers: number[]
}

const INITIAL_FORM: FormState = {
  kode: "",
  nama: "",
  sks: 3,
  jenis: "reguler",
  jumlahSesi: 8,
  tugaSesiNumbers: [3, 5, 7],
  zoomSesiNumbers: [],
}

export function AddMataKuliahDialog({
  open,
  onOpenChange,
  semesterId,
  onSuccess,
}: AddMataKuliahDialogProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)

  // Sync defaults when jenis changes
  useEffect(() => {
    const defaults = JENIS_DEFAULTS[form.jenis]
    setForm((prev) => ({
      ...prev,
      jumlahSesi: defaults.jumlahSesi,
      tugaSesiNumbers: defaults.tugaSesiNumbers,
      zoomSesiNumbers: [],
    }))
  }, [form.jenis])

  const handleJumlahSesiChange = (newTotal: number) => {
    setForm((prev) => ({
      ...prev,
      jumlahSesi: newTotal,
      tugaSesiNumbers: prev.tugaSesiNumbers.filter((n) => n <= newTotal),
      zoomSesiNumbers: prev.zoomSesiNumbers.filter((n) => n <= newTotal),
    }))
  }

  const toggleTugaSesi = (n: number) => {
    setForm((prev) => {
      const tugaNums = prev.tugaSesiNumbers.includes(n)
        ? prev.tugaSesiNumbers.filter((x) => x !== n)
        : [...prev.tugaSesiNumbers, n].sort((a, b) => a - b)
      return { ...prev, tugaSesiNumbers: tugaNums }
    })
  }

  const toggleZoomSesi = (n: number) => {
    setForm((prev) => {
      const next = prev.zoomSesiNumbers.includes(n)
        ? prev.zoomSesiNumbers.filter((x) => x !== n)
        : [...prev.zoomSesiNumbers, n].sort((a, b) => a - b)
      return { ...prev, zoomSesiNumbers: next }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.kode.trim() || !form.nama.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/kuliah/matkul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterId,
          kode: form.kode,
          nama: form.nama,
          sks: form.sks,
          jenis: form.jenis,
          jumlahSesi: form.jumlahSesi,
          tugaSesiNumbers: form.tugaSesiNumbers,
          ...(form.jenis === "tuweb" && {
            zoomSesiNumbers: form.zoomSesiNumbers,
          }),
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const data: MataKuliahData = await res.json()
      setForm(INITIAL_FORM)
      onSuccess(data)
      onOpenChange(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isTuweb = form.jenis === "tuweb"
  const allNums = Array.from({ length: form.jumlahSesi }, (_, i) => i + 1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{t.kuliah.addCourse}</DialogTitle>
          <DialogDescription className="text-xs">
            {t.kuliah.addCourseDialogDesc}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Kode + SKS */}
          <div className="grid grid-cols-[1fr_80px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="add-kode" className="text-xs font-medium text-muted-foreground">
                {t.kuliah.courseCode}
              </Label>
              <Input
                id="add-kode"
                placeholder="EKMA4116"
                value={form.kode}
                onChange={(e) => setForm((p) => ({ ...p, kode: e.target.value }))}
                className="h-9 text-sm font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-sks" className="text-xs font-medium text-muted-foreground">
                SKS
              </Label>
              <Input
                id="add-sks"
                type="number"
                min={1}
                max={6}
                value={form.sks}
                onChange={(e) => setForm((p) => ({ ...p, sks: Number(e.target.value) || 1 }))}
                className="h-9 text-sm text-center"
              />
            </div>
          </div>

          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="add-nama" className="text-xs font-medium text-muted-foreground">
              {t.kuliah.courseName}
            </Label>
            <Input
              id="add-nama"
              placeholder="Manajemen"
              value={form.nama}
              onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
              className="h-9 text-sm"
              required
            />
          </div>

          {/* Jenis + Jumlah Sesi */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="add-jenis" className="text-xs font-medium text-muted-foreground">
                {t.kuliah.courseType}
              </Label>
              <Select
                value={form.jenis}
                onValueChange={(v) => setForm((p) => ({ ...p, jenis: v as FormState["jenis"] }))}
              >
                <SelectTrigger id="add-jenis" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reguler">{t.kuliah.regularLabel}</SelectItem>
                  <SelectItem value="praktik">{t.kuliah.practicalLabel}</SelectItem>
                  <SelectItem value="tuweb">Tuweb</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="add-jumlah-sesi" className="text-xs font-medium text-muted-foreground">
                {isTuweb ? t.kuliah.numActivities : t.kuliah.numSessions}
              </Label>
              <Input
                id="add-jumlah-sesi"
                type="number"
                min={1}
                max={30}
                value={form.jumlahSesi}
                onChange={(e) => handleJumlahSesiChange(Number(e.target.value) || 1)}
                className="h-9 text-sm text-center"
              />
            </div>
          </div>

          {/* Jenis description */}
          <p className="text-[11px] text-muted-foreground -mt-2 leading-relaxed">
            {form.jenis === "reguler" && t.kuliah.regularCourseFormula}
            {form.jenis === "praktik" && t.kuliah.practicalCourseFormula}
            {form.jenis === "tuweb" && t.kuliah.tuwebCourseFormula}
          </p>

          {/* Sesi Tugas */}
          <SessionToggleGrid
            label={t.kuliah.taskActivities}
            icon={<FileText className="h-3 w-3" />}
            sessions={allNums}
            selected={form.tugaSesiNumbers}
            onToggle={toggleTugaSesi}
            activeClass="bg-amber-500 text-white border-amber-500"
            hint={`${form.tugaSesiNumbers.length} ${t.kuliah.sessionsSelected}`}
          />

          {/* Aktivitas Zoom — tuweb only */}
          {isTuweb && (
            <SessionToggleGrid
              label={t.kuliah.zoomActivities}
              icon={<Video className="h-3 w-3 text-purple-500" />}
              sessions={allNums}
              selected={form.zoomSesiNumbers}
              onToggle={toggleZoomSesi}
              activeClass="bg-purple-500 text-white border-purple-500"
              hint={`${form.zoomSesiNumbers.length} ${t.kuliah.zoomActivitiesSelected}`}
            />
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 text-xs"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-9 text-xs"
              disabled={loading || !form.kode.trim() || !form.nama.trim()}
            >
              {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              {t.kuliah.addCourse}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared session toggle grid
// ─────────────────────────────────────────────────────────────────────────────
function SessionToggleGrid({
  label,
  icon,
  sessions,
  selected,
  onToggle,
  activeClass,
  hint,
  description,
}: {
  label: string
  icon: React.ReactNode
  sessions: number[]
  selected: number[]
  onToggle: (n: number) => void
  activeClass: string
  hint?: string
  description?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground">{icon}</span>
        <Label className="text-xs font-medium">{label}</Label>
        {hint && (
          <span className="ml-auto text-[10px] text-muted-foreground">{hint}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sessions.map((n) => {
          const active = selected.includes(n)
          return (
            <button
              key={n}
              type="button"
              onClick={() => onToggle(n)}
              className={cn(
                "h-7 w-7 rounded-md text-[11px] font-bold border transition-all duration-150",
                active
                  ? activeClass
                  : "bg-muted/50 text-muted-foreground border-border/60 hover:border-muted-foreground/40 hover:bg-muted"
              )}
            >
              {n}
            </button>
          )
        })}
      </div>
      {description && (
        <p className="text-[10px] text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
