"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, RotateCcw, Save, AlertTriangle } from "lucide-react"
import { KuliahSettingsData, DEFAULT_SETTINGS } from "@/lib/kuliah-types"
import { cn } from "@/lib/utils"

export function GradeSettings() {
  const [settings, setSettings] = useState<KuliahSettingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/kuliah/settings")
      if (res.ok) {
        setSettings(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const update = (field: keyof KuliahSettingsData, value: number) => {
    setSettings((prev) => {
      if (!prev) return prev
      return { ...prev, [field]: value }
    })
    setDirty(true)
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const {
        bobotKehadiran,
        bobotDiskusi,
        bobotTugas,
        kontribusiUAS,
        kontribusiTuton,
        kontribusiDiskusiPraktik,
        kontribusiTugasPraktik,
        batasA,
        batasB,
        batasC,
        batasD,
      } = settings

      await fetch("/api/kuliah/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bobotKehadiran,
          bobotDiskusi,
          bobotTugas,
          kontribusiUAS,
          kontribusiTuton,
          kontribusiDiskusiPraktik,
          kontribusiTugasPraktik,
          batasA,
          batasB,
          batasC,
          batasD,
        }),
      })
      setDirty(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!settings) return
    setSettings({
      ...settings,
      ...DEFAULT_SETTINGS,
    })
    setDirty(true)
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Validation
  const tutonTotal =
    settings.bobotKehadiran + settings.bobotDiskusi + settings.bobotTugas
  const regulerTotal = settings.kontribusiUAS + settings.kontribusiTuton
  const praktikTotal =
    settings.kontribusiDiskusiPraktik + settings.kontribusiTugasPraktik
  const tutonValid = Math.abs(tutonTotal - 100) < 0.1
  const regulerValid = Math.abs(regulerTotal - 100) < 0.1
  const praktikValid = Math.abs(praktikTotal - 100) < 0.1
  const allValid = tutonValid && regulerValid && praktikValid

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header + Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Pengaturan Bobot Penilaian
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Sesuaikan bobot perhitungan nilai sesuai ketentuan program studi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 min-h-0 text-muted-foreground"
            onClick={handleReset}
          >
            <RotateCcw size={12} /> Reset Default
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 min-h-0"
            onClick={handleSave}
            disabled={saving || !dirty || !allValid}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save size={12} />
            )}
            Simpan
          </Button>
        </div>
      </div>

      {/* ====== BOBOT TUTON ====== */}
      <SettingsSection
        title="Bobot Komponen Tutorial Online (Tuton)"
        subtitle="Total harus 100%"
        total={tutonTotal}
        valid={tutonValid}
      >
        <div className="grid grid-cols-3 gap-4">
          <SettingsField
            label="Kehadiran"
            value={settings.bobotKehadiran}
            onChange={(v) => update("bobotKehadiran", v)}
            suffix="%"
          />
          <SettingsField
            label="Diskusi"
            value={settings.bobotDiskusi}
            onChange={(v) => update("bobotDiskusi", v)}
            suffix="%"
          />
          <SettingsField
            label="Tugas"
            value={settings.bobotTugas}
            onChange={(v) => update("bobotTugas", v)}
            suffix="%"
          />
        </div>
      </SettingsSection>

      {/* ====== KONTRIBUSI REGULER ====== */}
      <SettingsSection
        title="Kontribusi Nilai Akhir — Mata Kuliah Reguler"
        subtitle="UAS + Tuton = 100%"
        total={regulerTotal}
        valid={regulerValid}
      >
        <div className="grid grid-cols-2 gap-4">
          <SettingsField
            label="UAS"
            value={settings.kontribusiUAS}
            onChange={(v) => update("kontribusiUAS", v)}
            suffix="%"
          />
          <SettingsField
            label="Tuton"
            value={settings.kontribusiTuton}
            onChange={(v) => update("kontribusiTuton", v)}
            suffix="%"
          />
        </div>
      </SettingsSection>

      {/* ====== KONTRIBUSI PRAKTIK ====== */}
      <SettingsSection
        title="Kontribusi Nilai Akhir — Mata Kuliah Praktik (tanpa Tuweb)"
        subtitle="Diskusi + Tugas = 100%"
        total={praktikTotal}
        valid={praktikValid}
      >
        <div className="grid grid-cols-2 gap-4">
          <SettingsField
            label="Diskusi"
            value={settings.kontribusiDiskusiPraktik}
            onChange={(v) => update("kontribusiDiskusiPraktik", v)}
            suffix="%"
          />
          <SettingsField
            label="Tugas"
            value={settings.kontribusiTugasPraktik}
            onChange={(v) => update("kontribusiTugasPraktik", v)}
            suffix="%"
          />
        </div>
      </SettingsSection>

      {/* ====== BATAS NILAI ====== */}
      <div className="rounded-xl border border-border bg-card shadow-xs p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Batas Nilai (Grade Boundaries)
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Batas bawah untuk masing-masing grade
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GradeField
            grade="A"
            value={settings.batasA}
            onChange={(v) => update("batasA", v)}
            color="text-emerald-600 dark:text-emerald-400"
          />
          <GradeField
            grade="B"
            value={settings.batasB}
            onChange={(v) => update("batasB", v)}
            color="text-blue-600 dark:text-blue-400"
          />
          <GradeField
            grade="C"
            value={settings.batasC}
            onChange={(v) => update("batasC", v)}
            color="text-amber-600 dark:text-amber-400"
          />
          <GradeField
            grade="D"
            value={settings.batasD}
            onChange={(v) => update("batasD", v)}
            color="text-orange-600 dark:text-orange-400"
          />
        </div>

        <p className="text-[10px] text-muted-foreground">
          Nilai di bawah {settings.batasD} = Grade E
        </p>
      </div>

      {/* Dirty indicator */}
      {dirty && (
        <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Ada perubahan yang belum disimpan
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Sub Components
// ============================================================================

function SettingsSection({
  title,
  subtitle,
  total,
  valid,
  children,
}: {
  title: string
  subtitle: string
  total: number
  valid: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {subtitle}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] font-bold tabular-nums min-h-0 min-w-0",
            valid
              ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "border-destructive/30 text-destructive"
          )}
        >
          {valid ? (
            `${total}% ✓`
          ) : (
            <span className="flex items-center gap-1">
              <AlertTriangle size={10} /> {total.toFixed(1)}%
            </span>
          )}
        </Badge>
      </div>
      {children}
    </div>
  )
}

function SettingsField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          type="number"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="h-9 text-sm tabular-nums pr-8 min-h-0"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function GradeField({
  grade,
  value,
  onChange,
  color,
}: {
  grade: string
  value: number
  onChange: (value: number) => void
  color: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className={cn("text-sm font-black", color)}>≥</span>
        <Label className="text-[11px] font-bold text-foreground">
          Grade {grade}
        </Label>
      </div>
      <Input
        type="number"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-9 text-sm tabular-nums min-h-0"
      />
    </div>
  )
}
