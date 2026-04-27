"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Loader2, 
  BookOpen, 
  Calculator, 
  GraduationCap,
  Target
} from "lucide-react"
import {
  SemesterData,
  MataKuliahData,
  KuliahSettingsData,
  DEFAULT_SETTINGS,
  calculateNilaiTuton,
  calculateNilaiAkhir,
  getGradeColor,
} from "@/lib/kuliah-types"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

export function NilaiView() {
  const [semesters, setSemesters] = useState<SemesterData[]>([])
  const [activeSemesterId, setActiveSemesterId] = useState("")
  const [settings, setSettings] = useState<KuliahSettingsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [semRes, setRes] = await Promise.all([
        fetch("/api/kuliah/semester"),
        fetch("/api/kuliah/settings"),
      ])
      if (semRes.ok) {
        const data = await semRes.json()
        setSemesters(data)
        if (data.length > 0 && !activeSemesterId) {
          setActiveSemesterId(data[0].id)
        }
      }
      if (setRes.ok) {
        setSettings(await setRes.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeSemesterId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const activeSemester = useMemo(() => 
    semesters.find((s) => s.id === activeSemesterId),
    [semesters, activeSemesterId]
  )

  const effectiveSettings = settings || ({
    ...DEFAULT_SETTINGS,
    userId: "",
  } as KuliahSettingsData)

  const handleUASUpdate = async (
    mkId: string,
    field: "uasJumlahSoal" | "uasJumlahBenar",
    value: string
  ) => {
    try {
      await fetch(`/api/kuliah/matkul/${mkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: Number(value) || 0 }),
      })
      await fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-full mx-auto">
      {/* Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Ringkasan Nilai</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Pantau progres akademik dan kalkulasi nilai akhir secara real-time.</p>
        </div>
        
        {semesters.length > 0 && (
          <Select value={activeSemesterId} onValueChange={setActiveSemesterId}>
            <SelectTrigger className="w-[200px] h-9 text-xs bg-background/50 backdrop-blur-sm border-muted-foreground/20">
              <SelectValue placeholder="Pilih Semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!activeSemester ||
      !activeSemester.mataKuliah ||
      activeSemester.mataKuliah.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/5 p-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-4 text-2xl">
            📊
          </div>
          <p className="text-sm font-medium text-foreground">
            {semesters.length === 0
              ? "Belum ada semester aktif"
              : "Belum ada mata kuliah terdaftar"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {semesters.length === 0
              ? "Buat semester baru di tab Tracker untuk memulai."
              : "Tambahkan mata kuliah di tab Tracker."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {activeSemester.mataKuliah.map((mk, index) => (
              <GradeCard 
                key={mk.id} 
                mk={mk} 
                settings={effectiveSettings} 
                index={index}
                onUASUpdate={handleUASUpdate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function GradeCard({ 
  mk, 
  settings, 
  index,
  onUASUpdate 
}: { 
  mk: MataKuliahData, 
  settings: KuliahSettingsData,
  index: number,
  onUASUpdate: (id: string, field: "uasJumlahSoal" | "uasJumlahBenar", val: string) => Promise<void>
}) {
  const tuton = calculateNilaiTuton(mk, settings)
  const result = calculateNilaiAkhir(mk, settings)
  
  const chartData = [
    { name: "Score", value: result.nilaiAkhir },
    { name: "Remaining", value: Math.max(0, 100 - result.nilaiAkhir) }
  ]

  const gradeColorClass = getGradeColor(result.letterGrade)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative rounded-2xl border border-border bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* SECTION 1: Left - Grade Status */}
        <div className="p-6 flex flex-col items-center justify-center space-y-4">
          <div className="relative w-32 h-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={56}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="hsl(var(--primary))" className="opacity-80" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center -space-y-1">
              <span className={cn("text-4xl font-black", gradeColorClass.split(" ")[0])}>
                {result.letterGrade}
              </span>
              <span className="text-xs font-bold text-slate-500 tabular-nums">
                {result.nilaiAkhir.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-900 tracking-wider uppercase">
                {mk.kode}
              </span>
              <Badge variant="outline" className="text-[9px] py-0 px-2 h-5 bg-primary/5 text-primary border-primary/20 font-bold uppercase rounded-full">
                {mk.jenis}
              </Badge>
            </div>
            <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug px-2">
              {mk.nama}
            </h3>
          </div>
        </div>

        {/* SECTION 2: Middle - Progress Breakdown */}
        <div className="p-6 flex flex-col justify-between bg-slate-50/30">
          <div className="space-y-6">
            <MetricSection 
              label="Kehadiran" 
              value={tuton.rataKehadiran} 
              weighted={tuton.nilaiKehadiran}
              max={settings.bobotKehadiran}
            />
            <MetricSection 
              label="Diskusi" 
              value={tuton.rataDiskusi} 
              weighted={tuton.nilaiDiskusi}
              max={settings.bobotDiskusi}
            />
            <MetricSection 
              label="Tugas" 
              value={tuton.rataTugas} 
              weighted={tuton.nilaiTugas}
              max={settings.bobotTugas}
            />
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tuton</p>
                <p className="text-lg font-black text-slate-900 tabular-nums">{tuton.totalTuton.toFixed(1)}</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bobot SKS</p>
                <p className="text-lg font-black text-slate-900 tabular-nums">{mk.sks} SKS</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <Target size={12} className="shrink-0" />
              <span>Target minimal kelulusan: <span className="text-slate-500 font-bold">{settings.batasD}</span></span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Right - Action & Calculation */}
        <div className="p-6 bg-slate-50/50 flex flex-col">
          {mk.jenis === "reguler" ? (
            <div className="space-y-6 flex-1">
              <div className="space-y-4">
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap size={14} className="text-primary" />
                  Input Data UAS
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Soal</label>
                    <Input
                      type="number"
                      min={0}
                      value={mk.uasJumlahSoal || ""}
                      onChange={(e) => onUASUpdate(mk.id, "uasJumlahSoal", e.target.value)}
                      className="h-10 text-xs bg-white border-slate-200 focus:ring-primary/20 rounded-xl font-bold"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Benar</label>
                    <Input
                      type="number"
                      min={0}
                      max={mk.uasJumlahSoal || undefined}
                      value={mk.uasJumlahBenar || ""}
                      onChange={(e) => onUASUpdate(mk.id, "uasJumlahBenar", e.target.value)}
                      className="h-10 text-xs bg-white border-slate-200 focus:ring-primary/20 rounded-xl font-bold"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Breakdown Kontribusi</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-600">Kontribusi UAS ({settings.kontribusiUAS}%)</span>
                    <span className="text-xs font-black text-slate-900 tabular-nums">{result.kontribusiUAS.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-[11px] font-bold text-slate-600">Kontribusi Tuton ({settings.kontribusiTuton}%)</span>
                    <span className="text-xs font-black text-slate-900 tabular-nums">{result.kontribusiTuton.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1">
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Calculator size={14} className="text-primary" />
                Kontribusi Praktik
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-600">Diskusi ({settings.kontribusiDiskusiPraktik}%)</span>
                  <span className="text-xs font-black text-slate-900 tabular-nums">{result.kontribusiUAS.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-600">Tugas ({settings.kontribusiTugasPraktik}%)</span>
                  <span className="text-xs font-black text-slate-900 tabular-nums">{result.kontribusiTuton.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="mt-auto p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <BookOpen size={16} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-primary font-medium leading-relaxed italic">
                  Mata kuliah praktik tidak menggunakan nilai UAS sebagai penentu nilai akhir.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function MetricSection({ 
  label, 
  value, 
  weighted, 
  max 
}: { 
  label: string, 
  value: number, 
  weighted: number, 
  max: number
}) {
  const percentage = max > 0 ? (weighted / max) * 100 : 0
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-black text-slate-900 tabular-nums">{weighted.toFixed(1)}</span>
          <span className="text-[10px] font-bold text-slate-400">/ {max}</span>
        </div>
      </div>
      
      <div className="relative h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.3)]"
        />
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold text-slate-400 uppercase">Rata-rata: {value.toFixed(1)}%</span>
        <span className="text-[10px] font-black text-primary tabular-nums">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  )
}
