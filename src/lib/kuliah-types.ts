// Kuliah Tracker shared types

// ============================================================================
// GradingScheme DSL — komponen nilai yang bisa dikonfigurasi per-MK
// ============================================================================

export type KomponenSource = "presence_pct" | "avg_session_field" | "manual" | "ratio"

export interface Komponen {
  id: string
  label: string
  weight: number // % kontribusi ke nilai akhir; semua komponen harus total 100
  source: KomponenSource
  config?: {
    sessionField?: "diskusi" | "tugas"
    filterFn?: "hasTugas" | "notHasTugas" | "all"
  }
}

export interface LetterBoundaries {
  A: number
  B: number
  C: number
  D: number
}

export interface GradingScheme {
  jumlahSesi: number
  komponen: Komponen[]
  letterBoundaries: LetterBoundaries
}

export interface GradingPresetData {
  id: string
  nama: string
  isPublic: boolean
  schemeJson: GradingScheme
  ownerId?: string | null
}

export interface KomponenResult extends Komponen {
  rawValue: number     // nilai mentah 0–100
  contribution: number // kontribusi ke nilai akhir (rawValue * weight / 100)
}

export interface NilaiAkhirResult {
  nilaiAkhir: number
  letterGrade: string
  komponen: KomponenResult[]
}

// ============================================================================
// Core data interfaces
// ============================================================================

export interface SesiKuliahData {
  id: string
  sesiNumber: number
  isCompleted: boolean
  kehadiran: boolean
  diskusi: number | null
  diskusiNA: boolean      // true = diskusi tidak relevan (dikecualikan dari rata-rata)
  tugas: number | null
  tugasNA: boolean        // true = tugas tidak relevan (dikecualikan dari rata-rata)
  hasTugas: boolean       // true = sesi ini adalah sesi tugas
  tugasDeadline?: string | null
  mataKuliahId: string
}

export type SessionStatus = "future" | "active" | "done" | "needs-input"

export function getSessionStatus(
  session: SesiKuliahData,
  semesterStart: string,
  now: Date = new Date()
): SessionStatus {
  const base = new Date(semesterStart)
  const sStart = new Date(base)
  sStart.setDate(base.getDate() + (session.sesiNumber - 1) * 7)
  const sEnd = new Date(sStart)
  sEnd.setDate(sStart.getDate() + 6)

  if (now < sStart) return "future"
  if (now <= sEnd) return "active"
  // Past session: absent counts as done (nothing to fill), present needs all data
  if (!session.kehadiran) return "done"
  const diskusiOk = session.hasTugas || session.diskusiNA || session.diskusi !== null
  const tugasOk = !session.hasTugas || session.tugasNA || session.tugas !== null
  return diskusiOk && tugasOk ? "done" : "needs-input"
}

export interface MataKuliahData {
  id: string
  kode: string
  nama: string
  sks: number
  jenis: "reguler" | "praktik" | "tuweb"
  semesterId: string
  jumlahSesi: number
  /** @deprecated gunakan SesiKuliah.hasTugas */
  sesiTugasList: string
  gradingPresetId?: string | null
  gradingOverride?: GradingScheme | null
  sessions: SesiKuliahData[]
  uasJumlahSoal: number
  uasJumlahBenar: number
  createdAt: string
}

export interface SemesterData {
  id: string
  nama: string
  tanggalMulai: string
  isActive: boolean
  totalSKS: number
  mataKuliah: MataKuliahData[]
  userId: string
  createdAt: string
}

export interface KuliahSettingsData {
  id?: string
  bobotKehadiran: number
  bobotDiskusi: number
  bobotTugas: number
  kontribusiUAS: number
  kontribusiTuton: number
  kontribusiDiskusiPraktik: number
  kontribusiTugasPraktik: number
  batasA: number
  batasB: number
  batasC: number
  batasD: number
  userId: string
}

export const DEFAULT_SETTINGS: Omit<KuliahSettingsData, "userId"> = {
  bobotKehadiran: 20,
  bobotDiskusi: 30,
  bobotTugas: 50,
  kontribusiUAS: 70,
  kontribusiTuton: 30,
  kontribusiDiskusiPraktik: 50,
  kontribusiTugasPraktik: 50,
  batasA: 80,
  batasB: 70,
  batasC: 56,
  batasD: 45,
}

// ============================================================================
// Preset bawaan
// ============================================================================

export const BUILTIN_PRESETS: Record<string, GradingScheme> = {
  // UT Tuton reguler & tuweb: UAS 70% + Tuton 30% (kehadiran 20/diskusi 30/tugas 50 dari Tuton)
  UT_REGULER: {
    jumlahSesi: 8,
    komponen: [
      { id: "uas", label: "UAS", weight: 70, source: "manual" },
      { id: "kehadiran", label: "Kehadiran", weight: 6, source: "presence_pct" },
      { id: "diskusi", label: "Diskusi", weight: 9, source: "avg_session_field", config: { sessionField: "diskusi", filterFn: "notHasTugas" } },
      { id: "tugas", label: "Tugas", weight: 15, source: "avg_session_field", config: { sessionField: "tugas", filterFn: "hasTugas" } },
    ],
    letterBoundaries: { A: 80, B: 70, C: 56, D: 45 },
  },
  UT_TUWEB: {
    jumlahSesi: 15,
    komponen: [
      { id: "uas", label: "UAS", weight: 70, source: "manual" },
      { id: "kehadiran", label: "Kehadiran", weight: 6, source: "presence_pct" },
      { id: "diskusi", label: "Diskusi", weight: 9, source: "avg_session_field", config: { sessionField: "diskusi", filterFn: "notHasTugas" } },
      { id: "tugas", label: "Tugas", weight: 15, source: "avg_session_field", config: { sessionField: "tugas", filterFn: "hasTugas" } },
    ],
    letterBoundaries: { A: 80, B: 70, C: 56, D: 45 },
  },
  // UT Praktik: hanya Diskusi 50% + Tugas 50%, tanpa UAS
  UT_PRAKTIK: {
    jumlahSesi: 8,
    komponen: [
      { id: "diskusi", label: "Diskusi", weight: 50, source: "avg_session_field", config: { sessionField: "diskusi", filterFn: "notHasTugas" } },
      { id: "tugas", label: "Tugas", weight: 50, source: "avg_session_field", config: { sessionField: "tugas", filterFn: "hasTugas" } },
    ],
    letterBoundaries: { A: 80, B: 70, C: 56, D: 45 },
  },
}

// ============================================================================
// GradingScheme resolution — inheritance: override > preset > KuliahSettings
// ============================================================================

export function settingsToGradingScheme(
  mk: Pick<MataKuliahData, "jenis" | "jumlahSesi">,
  settings: KuliahSettingsData
): GradingScheme {
  const boundaries: LetterBoundaries = {
    A: settings.batasA,
    B: settings.batasB,
    C: settings.batasC,
    D: settings.batasD,
  }

  if (mk.jenis === "praktik") {
    return {
      jumlahSesi: mk.jumlahSesi,
      komponen: [
        { id: "diskusi", label: "Diskusi", weight: settings.kontribusiDiskusiPraktik, source: "avg_session_field", config: { sessionField: "diskusi", filterFn: "notHasTugas" } },
        { id: "tugas", label: "Tugas", weight: settings.kontribusiTugasPraktik, source: "avg_session_field", config: { sessionField: "tugas", filterFn: "hasTugas" } },
      ],
      letterBoundaries: boundaries,
    }
  }

  // reguler & tuweb: UAS + Tuton (kehadiran/diskusi/tugas)
  const tC = settings.kontribusiTuton
  return {
    jumlahSesi: mk.jumlahSesi,
    komponen: [
      { id: "uas", label: "UAS", weight: settings.kontribusiUAS, source: "manual" },
      { id: "kehadiran", label: "Kehadiran", weight: (settings.bobotKehadiran / 100) * tC, source: "presence_pct" },
      { id: "diskusi", label: "Diskusi", weight: (settings.bobotDiskusi / 100) * tC, source: "avg_session_field", config: { sessionField: "diskusi", filterFn: "notHasTugas" } },
      { id: "tugas", label: "Tugas", weight: (settings.bobotTugas / 100) * tC, source: "avg_session_field", config: { sessionField: "tugas", filterFn: "hasTugas" } },
    ],
    letterBoundaries: boundaries,
  }
}

export function resolveGradingScheme(
  mk: Pick<MataKuliahData, "jenis" | "jumlahSesi" | "gradingOverride" | "gradingPresetId">,
  settings: KuliahSettingsData,
  presets?: GradingPresetData[]
): GradingScheme {
  if (mk.gradingOverride) return mk.gradingOverride
  if (mk.gradingPresetId && presets) {
    const preset = presets.find((p) => p.id === mk.gradingPresetId)
    if (preset) return preset.schemeJson
  }
  return settingsToGradingScheme(mk, settings)
}

// ============================================================================
// Dynamic calculation — membaca GradingScheme
// ============================================================================

function getKomponenRawValue(
  k: Komponen,
  sessions: SesiKuliahData[],
  jumlahSesi: number,
  uasJumlahSoal: number,
  uasJumlahBenar: number
): number {
  switch (k.source) {
    case "presence_pct":
      return jumlahSesi > 0 ? (sessions.filter((s) => s.kehadiran).length / jumlahSesi) * 100 : 0
    case "avg_session_field": {
      const field = k.config?.sessionField
      if (!field) return 0
      const filtered =
        k.config?.filterFn === "hasTugas"
          ? sessions.filter((s) => s.hasTugas)
          : k.config?.filterFn === "notHasTugas"
          ? sessions.filter((s) => !s.hasTugas)
          : sessions
      const naField = field === "diskusi" ? "diskusiNA" : "tugasNA"
      const vals = filtered
        .filter((s) => !s[naField] && s[field] !== null)
        .map((s) => s[field] as number)
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    }
    case "manual":
      return uasJumlahSoal > 0 ? (uasJumlahBenar / uasJumlahSoal) * 100 : 0
    case "ratio":
      return 0
  }
}

export function calculateNilaiAkhirWithScheme(
  mk: Pick<MataKuliahData, "sessions" | "jumlahSesi" | "uasJumlahSoal" | "uasJumlahBenar">,
  scheme: GradingScheme
): NilaiAkhirResult {
  const sessions = mk.sessions || []
  const komponen: KomponenResult[] = scheme.komponen.map((k) => {
    const rawValue = getKomponenRawValue(k, sessions, scheme.jumlahSesi, mk.uasJumlahSoal, mk.uasJumlahBenar)
    return { ...k, rawValue, contribution: (rawValue * k.weight) / 100 }
  })
  const nilaiAkhir = komponen.reduce((sum, k) => sum + k.contribution, 0)
  return {
    nilaiAkhir,
    letterGrade: getLetterGradeFromBoundaries(nilaiAkhir, scheme.letterBoundaries),
    komponen,
  }
}

// ============================================================================
// Legacy helpers — tetap berfungsi, pakai hasTugas dengan fallback ke CSV
// ============================================================================

export function parseSesiTugasList(list: string): number[] {
  return list
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n))
}

/** Ambil nomor sesi tugas: pakai hasTugas bila ada, fallback ke sesiTugasList (data lama) */
function getTugasSessionNumbers(mk: MataKuliahData): number[] {
  const annotated = mk.sessions?.filter((s) => s.hasTugas) ?? []
  if (annotated.length > 0) return annotated.map((s) => s.sesiNumber)
  return parseSesiTugasList(mk.sesiTugasList || "3,5,7")
}

export function getLetterGradeFromBoundaries(nilai: number, b: LetterBoundaries): string {
  if (nilai >= b.A) return "A"
  if (nilai >= b.B) return "B"
  if (nilai >= b.C) return "C"
  if (nilai >= b.D) return "D"
  return "E"
}

export function getLetterGrade(nilai: number, settings: KuliahSettingsData): string {
  return getLetterGradeFromBoundaries(nilai, {
    A: settings.batasA,
    B: settings.batasB,
    C: settings.batasC,
    D: settings.batasD,
  })
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case "A": return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
    case "B": return "text-blue-600 dark:text-blue-400 bg-blue-500/10"
    case "C": return "text-amber-600 dark:text-amber-400 bg-amber-500/10"
    case "D": return "text-orange-600 dark:text-orange-400 bg-orange-500/10"
    case "E": return "text-red-600 dark:text-red-400 bg-red-500/10"
    default:  return "text-muted-foreground bg-muted"
  }
}

export function calculateNilaiTuton(
  mk: MataKuliahData,
  settings: KuliahSettingsData
): {
  rataKehadiran: number
  rataDiskusi: number
  rataTugas: number
  nilaiKehadiran: number
  nilaiDiskusi: number
  nilaiTugas: number
  totalTuton: number
} {
  const sessions = mk.sessions || []
  const tugasSessionNumbers = getTugasSessionNumbers(mk)
  const totalSessions = mk.jumlahSesi || 8

  const rataKehadiran = (sessions.filter((s) => s.kehadiran).length / totalSessions) * 100

  const diskusiValues = sessions
    .filter((s) => s.diskusi !== null && !s.diskusiNA && !tugasSessionNumbers.includes(s.sesiNumber))
    .map((s) => s.diskusi!)
  const rataDiskusi =
    diskusiValues.length > 0 ? diskusiValues.reduce((a, b) => a + b, 0) / diskusiValues.length : 0

  const tugasValues = sessions
    .filter((s) => tugasSessionNumbers.includes(s.sesiNumber) && s.tugas !== null && !s.tugasNA)
    .map((s) => s.tugas!)
  const rataTugas =
    tugasValues.length > 0 ? tugasValues.reduce((a, b) => a + b, 0) / tugasValues.length : 0

  const nilaiKehadiran = (rataKehadiran * settings.bobotKehadiran) / 100
  const nilaiDiskusi = (rataDiskusi * settings.bobotDiskusi) / 100
  const nilaiTugas = (rataTugas * settings.bobotTugas) / 100
  const totalTuton = nilaiKehadiran + nilaiDiskusi + nilaiTugas

  return { rataKehadiran, rataDiskusi, rataTugas, nilaiKehadiran, nilaiDiskusi, nilaiTugas, totalTuton }
}

export function calculateNilaiAkhir(
  mk: MataKuliahData,
  settings: KuliahSettingsData
): {
  nilaiUAS: number
  nilaiTuton: number
  kontribusiUAS: number
  kontribusiTuton: number
  nilaiAkhir: number
  letterGrade: string
} {
  const tutonResult = calculateNilaiTuton(mk, settings)

  if (mk.jenis === "praktik") {
    const sessions = mk.sessions || []
    const tugasSessionNumbers = getTugasSessionNumbers(mk)

    const diskusiValues = sessions.filter((s) => s.diskusi !== null).map((s) => s.diskusi!)
    const rataDiskusi =
      diskusiValues.length > 0 ? diskusiValues.reduce((a, b) => a + b, 0) / diskusiValues.length : 0

    const tugasValues = sessions
      .filter((s) => tugasSessionNumbers.includes(s.sesiNumber) && s.tugas !== null)
      .map((s) => s.tugas!)
    const rataTugas =
      tugasValues.length > 0 ? tugasValues.reduce((a, b) => a + b, 0) / tugasValues.length : 0

    const kontribusiDiskusi = (rataDiskusi * settings.kontribusiDiskusiPraktik) / 100
    const kontribusiTugas = (rataTugas * settings.kontribusiTugasPraktik) / 100
    const nilaiAkhir = kontribusiDiskusi + kontribusiTugas

    return {
      nilaiUAS: 0,
      nilaiTuton: tutonResult.totalTuton,
      kontribusiUAS: kontribusiDiskusi,
      kontribusiTuton: kontribusiTugas,
      nilaiAkhir,
      letterGrade: getLetterGrade(nilaiAkhir, settings),
    }
  }

  const nilaiUAS = mk.uasJumlahSoal > 0 ? (mk.uasJumlahBenar / mk.uasJumlahSoal) * 100 : 0
  const nilaiTuton = tutonResult.totalTuton
  const kontribusiUAS = (nilaiUAS * settings.kontribusiUAS) / 100
  const kontribusiTuton = (nilaiTuton * settings.kontribusiTuton) / 100
  const nilaiAkhir = kontribusiUAS + kontribusiTuton

  return {
    nilaiUAS,
    nilaiTuton,
    kontribusiUAS,
    kontribusiTuton,
    nilaiAkhir,
    letterGrade: getLetterGrade(nilaiAkhir, settings),
  }
}

export function getSessionDate(startDate: string, sessionNumber: number): string {
  const date = new Date(startDate)
  date.setDate(date.getDate() + (sessionNumber - 1) * 7)
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
}

export function getSessionDateRange(startDate: string, sessionNumber: number): string {
  const start = new Date(startDate)
  start.setDate(start.getDate() + (sessionNumber - 1) * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmtStart = start.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" })
  const fmtEnd = end.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "2-digit" })
  return `${fmtStart}–${fmtEnd}`
}
