// Kuliah Tracker shared types

export interface SesiKuliahData {
  id: string
  sesiNumber: number
  kehadiran: boolean
  diskusi: number | null
  tugas: number | null
  mataKuliahId: string
}

export interface MataKuliahData {
  id: string
  kode: string
  nama: string
  sks: number
  jenis: "reguler" | "praktik"
  semesterId: string
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

// Grade calculation utilities
export function getLetterGrade(nilai: number, settings: KuliahSettingsData): string {
  if (nilai >= settings.batasA) return "A"
  if (nilai >= settings.batasB) return "B"
  if (nilai >= settings.batasC) return "C"
  if (nilai >= settings.batasD) return "D"
  return "E"
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case "A": return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
    case "B": return "text-blue-600 dark:text-blue-400 bg-blue-500/10"
    case "C": return "text-amber-600 dark:text-amber-400 bg-amber-500/10"
    case "D": return "text-orange-600 dark:text-orange-400 bg-orange-500/10"
    case "E": return "text-red-600 dark:text-red-400 bg-red-500/10"
    default: return "text-muted-foreground bg-muted"
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

  // Kehadiran: count of true / 8, scaled to max score
  const totalKehadiran = sessions.filter((s) => s.kehadiran).length
  const rataKehadiran = (totalKehadiran / 8) * 100

  // Diskusi: average of non-null values
  const diskusiValues = sessions.filter((s) => s.diskusi !== null).map((s) => s.diskusi!)
  const rataDiskusi = diskusiValues.length > 0
    ? diskusiValues.reduce((a, b) => a + b, 0) / diskusiValues.length
    : 0

  // Tugas: average of non-null tugas (sesi 3, 5, 7)
  const tugasSessions = sessions.filter((s) => [3, 5, 7].includes(s.sesiNumber))
  const tugasValues = tugasSessions.filter((s) => s.tugas !== null).map((s) => s.tugas!)
  const rataTugas = tugasValues.length > 0
    ? tugasValues.reduce((a, b) => a + b, 0) / tugasValues.length
    : 0

  const nilaiKehadiran = (rataKehadiran * settings.bobotKehadiran) / 100
  const nilaiDiskusi = (rataDiskusi * settings.bobotDiskusi) / 100
  const nilaiTugas = (rataTugas * settings.bobotTugas) / 100
  const totalTuton = nilaiKehadiran + nilaiDiskusi + nilaiTugas

  return {
    rataKehadiran,
    rataDiskusi,
    rataTugas,
    nilaiKehadiran,
    nilaiDiskusi,
    nilaiTugas,
    totalTuton,
  }
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
    // Praktik tanpa Tuweb: Diskusi% + Tugas% only
    const sessions = mk.sessions || []
    const diskusiValues = sessions.filter((s) => s.diskusi !== null).map((s) => s.diskusi!)
    const rataDiskusi = diskusiValues.length > 0
      ? diskusiValues.reduce((a, b) => a + b, 0) / diskusiValues.length
      : 0

    const tugasSessions = sessions.filter((s) => [3, 5, 7].includes(s.sesiNumber))
    const tugasValues = tugasSessions.filter((s) => s.tugas !== null).map((s) => s.tugas!)
    const rataTugas = tugasValues.length > 0
      ? tugasValues.reduce((a, b) => a + b, 0) / tugasValues.length
      : 0

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

  // Reguler: UAS 70% + Tuton 30%
  const nilaiUAS = mk.uasJumlahSoal > 0
    ? (mk.uasJumlahBenar / mk.uasJumlahSoal) * 100
    : 0
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

// Calculate session date from semester start date
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
  return `${fmtStart} s/d ${fmtEnd}`
}
