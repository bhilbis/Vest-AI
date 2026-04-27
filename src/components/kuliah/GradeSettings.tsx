"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Loader2, 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  Users,
  Monitor,
  FileText,
  Scale,
  CheckCircle2,
  Info,
  type LucideIcon
} from "lucide-react"
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Memuat pengaturan...</p>
        </div>
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
    <div className="max-w-6xl mx-auto space-y-10 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Pengaturan Bobot Penilaian
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Sesuaikan parameter perhitungan nilai sesuai dengan standar akademik terbaru
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-4 text-xs font-bold gap-2 text-muted-foreground hover:bg-white dark:hover:bg-muted shadow-sm border border-transparent hover:border-border"
            onClick={handleReset}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Default
          </Button>
          <Button
            size="sm"
            className="h-10 px-6 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 border-none"
            onClick={handleSave}
            disabled={saving || !dirty || !allValid}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bobot Tuton */}
        <WeightCard
          title="Bobot Komponen Tuton"
          subtitle="Distribusi nilai pada tutorial online"
          icon={Users}
          total={tutonTotal}
          isValid={tutonValid}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SettingsField
              label="Kehadiran"
              value={settings.bobotKehadiran}
              onChange={(v) => update("bobotKehadiran", v)}
            />
            <SettingsField
              label="Diskusi"
              value={settings.bobotDiskusi}
              onChange={(v) => update("bobotDiskusi", v)}
            />
            <SettingsField
              label="Tugas"
              value={settings.bobotTugas}
              onChange={(v) => update("bobotTugas", v)}
            />
          </div>
        </WeightCard>

        {/* Kontribusi Reguler */}
        <WeightCard
          title="Mata Kuliah Reguler"
          subtitle="Kontribusi UAS dan Tuton ke Nilai Akhir"
          icon={Monitor}
          total={regulerTotal}
          isValid={regulerValid}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SettingsField
              label="UAS"
              value={settings.kontribusiUAS}
              onChange={(v) => update("kontribusiUAS", v)}
            />
            <SettingsField
              label="Tuton"
              value={settings.kontribusiTuton}
              onChange={(v) => update("kontribusiTuton", v)}
            />
          </div>
        </WeightCard>

        {/* Kontribusi Praktik */}
        <WeightCard
          title="Mata Kuliah Praktik"
          subtitle="Kontribusi komponen untuk mata kuliah non-Tuweb"
          icon={FileText}
          total={praktikTotal}
          isValid={praktikValid}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SettingsField
              label="Diskusi"
              value={settings.kontribusiDiskusiPraktik}
              onChange={(v) => update("kontribusiDiskusiPraktik", v)}
            />
            <SettingsField
              label="Tugas"
              value={settings.kontribusiTugasPraktik}
              onChange={(v) => update("kontribusiTugasPraktik", v)}
            />
          </div>
        </WeightCard>

        {/* Grade Boundaries */}
        <GradeBoundariesCard settings={settings} update={update} />
      </div>

      {/* Dirty Indicator Floating */}
      {dirty && (
        <div className="fixed bottom-8 right-8 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
            Perubahan belum disimpan
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Redesigned Sub Components
// ============================================================================

interface WeightCardProps {
  title: string
  subtitle: string
  icon: LucideIcon
  total: number
  isValid: boolean
  children: React.ReactNode
}

function WeightCard({ title, subtitle, icon: Icon, total, isValid, children }: WeightCardProps) {
  return (
    <div className="bg-white dark:bg-card rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 p-8 flex flex-col h-full">
      <div className="flex items-start justify-between mb-8">
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#F1F5F9] dark:bg-muted flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6 text-foreground/70" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{subtitle}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "px-3 py-1.5 rounded-full text-[11px] font-black tabular-nums border-none shadow-sm",
            isValid
              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          )}
        >
          {isValid ? (
            <span className="flex items-center gap-1.5">
              100% <CheckCircle2 size={12} strokeWidth={3} />
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={12} strokeWidth={3} /> {total.toFixed(1)}%
            </span>
          )}
        </Badge>
      </div>

      <div className="flex-1 mb-8">
        {children}
      </div>

      <div className="space-y-3 mt-auto pt-6 border-t border-border/30">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>Total Akumulasi</span>
          <span className={cn(isValid ? "text-emerald-600" : "text-red-600")}>
            {total.toFixed(0)}%
          </span>
        </div>
        <Progress 
          value={total} 
          className={cn(
            "h-2 bg-muted rounded-full",
            isValid ? "[&>div]:bg-emerald-500" : "[&>div]:bg-red-500"
          )} 
        />
      </div>
    </div>
  )
}

function SettingsField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2.5">
      <Label className="text-[12px] font-bold text-muted-foreground/80 ml-1">
        {label}
      </Label>
      <div className="relative group">
        <Input
          type="number"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="h-12 bg-[#F8FAFC] dark:bg-muted/50 border-border/50 rounded-xl text-sm font-bold tabular-nums pr-10 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/50">
          %
        </span>
      </div>
    </div>
  )
}

function GradeBoundariesCard({ 
  settings, 
  update 
}: { 
  settings: KuliahSettingsData, 
  update: (field: keyof KuliahSettingsData, value: number) => void 
}) {
  const grades = [
    { label: "A", field: "batasA" as const, color: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50" },
    { label: "B", field: "batasB" as const, color: "bg-blue-500", text: "text-blue-600", light: "bg-blue-50" },
    { label: "C", field: "batasC" as const, color: "bg-amber-500", text: "text-amber-600", light: "bg-amber-50" },
    { label: "D", field: "batasD" as const, color: "bg-orange-500", text: "text-orange-600", light: "bg-orange-50" },
  ]

  return (
    <div className="bg-white dark:bg-card rounded-3xl border border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 p-8 flex flex-col lg:col-span-2">
      <div className="flex items-start gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-[#F1F5F9] dark:bg-muted flex items-center justify-center shrink-0">
          <Scale className="h-6 w-6 text-foreground/70" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground tracking-tight">Batas Nilai (Grade Boundaries)</h3>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Tentukan ambang batas minimum untuk setiap tingkatan nilai</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {grades.map((g) => (
          <div key={g.label} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-black text-sm shadow-sm", g.color, "text-white")}>
                {g.label}
              </div>
              <Label className="text-xs font-bold text-muted-foreground">Grade {g.label}</Label>
            </div>
            <div className="relative">
              <span className={cn("absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black", g.text)}>≥</span>
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                value={settings[g.field]}
                onChange={(e) => update(g.field, Number(e.target.value) || 0)}
                className="h-14 bg-[#F8FAFC] dark:bg-muted/50 border-border/50 rounded-2xl text-base font-black tabular-nums pl-10 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Visual Scale */}
      <div className="relative pt-10 pb-4">
        <div className="flex justify-between mb-3 px-1">
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">Grade A</span>
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">Grade B</span>
          <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">Grade C</span>
          <span className="text-[10px] font-black text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-md">Grade D</span>
          <span className="text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md">Grade E</span>
        </div>
        
        <div className="h-6 w-full bg-muted rounded-2xl overflow-hidden flex shadow-inner border border-border/30 p-1">
          <div className="h-full bg-emerald-500 rounded-l-xl transition-all duration-500 ease-in-out" style={{ width: `${100 - settings.batasA}%` }} />
          <div className="h-full bg-blue-500 transition-all duration-500 ease-in-out" style={{ width: `${settings.batasA - settings.batasB}%` }} />
          <div className="h-full bg-amber-500 transition-all duration-500 ease-in-out" style={{ width: `${settings.batasB - settings.batasC}%` }} />
          <div className="h-full bg-orange-500 transition-all duration-500 ease-in-out" style={{ width: `${settings.batasC - settings.batasD}%` }} />
          <div className="h-full bg-red-500 rounded-r-xl flex-1 transition-all duration-500 ease-in-out" />
        </div>
        
        <div className="flex justify-between mt-4 px-1">
          <div className="flex flex-col items-center">
            <div className="h-3 w-0.5 bg-border/50 mb-1" />
            <span className="text-[11px] font-black tabular-nums text-foreground">{settings.batasA}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-3 w-0.5 bg-border/50 mb-1" />
            <span className="text-[11px] font-black tabular-nums text-foreground">{settings.batasB}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-3 w-0.5 bg-border/50 mb-1" />
            <span className="text-[11px] font-black tabular-nums text-foreground">{settings.batasC}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-3 w-0.5 bg-border/50 mb-1" />
            <span className="text-[11px] font-black tabular-nums text-foreground">{settings.batasD}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-3 w-0.5 bg-border/50 mb-1" />
            <span className="text-[11px] font-black tabular-nums text-foreground">0</span>
          </div>
        </div>
        
        <div className="mt-8 p-4 rounded-2xl bg-[#F8FAFC] dark:bg-muted/30 border border-border/50 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Info className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
            Mahasiswa dengan nilai di bawah <span className="font-bold text-foreground">{settings.batasD}</span> akan secara otomatis mendapatkan <span className="font-bold text-red-600">Grade E</span>.
          </p>
        </div>
      </div>
    </div>
  )
}
