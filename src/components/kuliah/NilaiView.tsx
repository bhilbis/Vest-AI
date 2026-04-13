/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, BookOpen, Calculator, GraduationCap } from "lucide-react"
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

  const activeSemester = semesters.find((s) => s.id === activeSemesterId)
  const effectiveSettings = settings || ({
    ...DEFAULT_SETTINGS,
    userId: "",
  } as KuliahSettingsData)

  // Handle UAS data update
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Semester Selector */}
      {semesters.length > 0 && (
        <Select value={activeSemesterId} onValueChange={setActiveSemesterId}>
          <SelectTrigger className="w-[240px] h-9 text-sm">
            <SelectValue placeholder="Pilih Semester" />
          </SelectTrigger>
          <SelectContent>
            {semesters.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!activeSemester ||
      !activeSemester.mataKuliah ||
      activeSemester.mataKuliah.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-xs p-12 text-center">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm text-muted-foreground">
            {semesters.length === 0
              ? "Buat semester terlebih dahulu di tab Tracker"
              : "Belum ada mata kuliah di semester ini"}
          </p>
        </div>
      ) : (
        <>
          {/* ====== SECTION 1: NILAI TUTON ====== */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Nilai Tutorial Online (Tuton)
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bobot: Kehadiran {effectiveSettings.bobotKehadiran}% · Diskusi{" "}
              {effectiveSettings.bobotDiskusi}% · Tugas{" "}
              {effectiveSettings.bobotTugas}%
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeSemester.mataKuliah.map((mk) => {
                const tuton = calculateNilaiTuton(mk, effectiveSettings)
                return (
                  <div
                    key={mk.id}
                    className="rounded-xl border border-border bg-card shadow-xs p-4 space-y-3"
                  >
                    {/* MK Header */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {mk.kode}
                      </span>
                      <span className="text-sm font-semibold text-foreground truncate">
                        {mk.nama}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[8px] min-h-0 min-w-0 ml-auto shrink-0",
                          mk.jenis === "reguler"
                            ? "border-primary/30 text-primary"
                            : "border-amber-500/30 text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {mk.jenis}
                      </Badge>
                    </div>

                    {/* Progress Bars */}
                    <div className="space-y-2.5">
                      <ProgressRow
                        label={`Kehadiran (${effectiveSettings.bobotKehadiran}%)`}
                        value={tuton.rataKehadiran}
                        weighted={tuton.nilaiKehadiran}
                        max={effectiveSettings.bobotKehadiran}
                      />
                      <ProgressRow
                        label={`Diskusi (${effectiveSettings.bobotDiskusi}%)`}
                        value={tuton.rataDiskusi}
                        weighted={tuton.nilaiDiskusi}
                        max={effectiveSettings.bobotDiskusi}
                      />
                      <ProgressRow
                        label={`Tugas (${effectiveSettings.bobotTugas}%)`}
                        value={tuton.rataTugas}
                        weighted={tuton.nilaiTugas}
                        max={effectiveSettings.bobotTugas}
                      />
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs font-medium text-muted-foreground">
                        Total Nilai Tuton
                      </span>
                      <span className="text-base font-bold tabular-nums text-primary">
                        {tuton.totalTuton.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ====== SECTION 2: NILAI AKHIR ====== */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Nilai Akhir
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Reguler: UAS {effectiveSettings.kontribusiUAS}% + Tuton{" "}
              {effectiveSettings.kontribusiTuton}% · Praktik: Diskusi{" "}
              {effectiveSettings.kontribusiDiskusiPraktik}% + Tugas{" "}
              {effectiveSettings.kontribusiTugasPraktik}%
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeSemester.mataKuliah.map((mk) => {
                const result = calculateNilaiAkhir(mk, effectiveSettings)
                return (
                  <div
                    key={mk.id}
                    className="rounded-xl border border-border bg-card shadow-xs p-4 space-y-3"
                  >
                    {/* MK Header */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {mk.kode}
                      </span>
                      <span className="text-sm font-semibold text-foreground truncate">
                        {mk.nama}
                      </span>
                    </div>

                    {mk.jenis === "reguler" ? (
                      <>
                        {/* UAS Input */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">
                              Jumlah Soal
                            </label>
                            <Input
                              type="number"
                              min={0}
                              value={mk.uasJumlahSoal || ""}
                              onChange={(e) =>
                                handleUASUpdate(
                                  mk.id,
                                  "uasJumlahSoal",
                                  e.target.value
                                )
                              }
                              className="h-8 text-xs tabular-nums min-h-0"
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground">
                              Jumlah Benar
                            </label>
                            <Input
                              type="number"
                              min={0}
                              max={mk.uasJumlahSoal || undefined}
                              value={mk.uasJumlahBenar || ""}
                              onChange={(e) =>
                                handleUASUpdate(
                                  mk.id,
                                  "uasJumlahBenar",
                                  e.target.value
                                )
                              }
                              className="h-8 text-xs tabular-nums min-h-0"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Computed Values */}
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Nilai UAS
                            </span>
                            <span className="font-semibold tabular-nums">
                              {result.nilaiUAS.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Nilai Tuton
                            </span>
                            <span className="font-semibold tabular-nums">
                              {result.nilaiTuton.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between text-muted-foreground/70">
                            <span>
                              Kontribusi UAS ({effectiveSettings.kontribusiUAS}
                              %)
                            </span>
                            <span className="tabular-nums">
                              {result.kontribusiUAS.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between text-muted-foreground/70">
                            <span>
                              Kontribusi Tuton (
                              {effectiveSettings.kontribusiTuton}%)
                            </span>
                            <span className="tabular-nums">
                              {result.kontribusiTuton.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Praktik — no UAS */
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Kontribusi Diskusi (
                            {effectiveSettings.kontribusiDiskusiPraktik}%)
                          </span>
                          <span className="font-semibold tabular-nums">
                            {result.kontribusiUAS.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Kontribusi Tugas (
                            {effectiveSettings.kontribusiTugasPraktik}%)
                          </span>
                          <span className="font-semibold tabular-nums">
                            {result.kontribusiTuton.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Final Grade */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <Calculator size={12} className="text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Nilai Akhir
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold tabular-nums text-foreground">
                          {result.nilaiAkhir.toFixed(1)}
                        </span>
                        <Badge
                          className={cn(
                            "text-sm font-black px-2.5 py-0.5 min-h-0 min-w-0",
                            getGradeColor(result.letterGrade)
                          )}
                          variant="outline"
                        >
                          {result.letterGrade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

// Progress row sub-component
function ProgressRow({
  label,
  value,
  weighted,
  max,
}: {
  label: string
  value: number
  weighted: number
  max: number
}) {
  const percent = max > 0 ? Math.min((weighted / max) * 100, 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/70 tabular-nums">
            avg {value.toFixed(1)}
          </span>
          <span className="text-[11px] font-semibold tabular-nums text-foreground">
            {weighted.toFixed(1)}
          </span>
        </div>
      </div>
      <Progress value={percent} className="h-1.5 bg-secondary" />
    </div>
  )
}
