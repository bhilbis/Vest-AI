"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PlusIcon,
  Loader2,
  Trash2,
  MoreHorizontal,
  CalendarDays,
  Check,
  X,
  BookOpen,
  Edit,
  Circle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AddMataKuliahDialog } from "./AddMataKuliahDialog"
import { EditMataKuliahDialog } from "./EditMataKuliahDialog"
import {
  SemesterData,
  MataKuliahData,
  SesiKuliahData,
  getSessionDateRange,
  parseSesiTugasList,
} from "@/lib/kuliah-types"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// Jenis config
// ─────────────────────────────────────────────────────────────────────────────
const JENIS_CONFIG: Record<
  string,
  { label: string; colLabel: string; badgeClass: string }
> = {
  reguler: {
    label: "Mata Kuliah Reguler",
    colLabel: "Sesi",
    badgeClass: "border-primary/30 text-primary",
  },
  praktik: {
    label: "Mata Kuliah Praktik (tanpa UAS)",
    colLabel: "Sesi",
    badgeClass: "border-amber-500/30 text-amber-600 dark:text-amber-400",
  },
  tuweb: {
    label: "Mata Kuliah Tuweb",
    colLabel: "Aktivitas",
    badgeClass: "border-purple-500/30 text-purple-600 dark:text-purple-400",
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export function TrackerGrid() {
  const [semesters, setSemesters] = useState<SemesterData[]>([])
  const [activeSemesterId, setActiveSemesterId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [addMkOpen, setAddMkOpen] = useState(false)
  const [editMk, setEditMk] = useState<MataKuliahData | null>(null)
  const [newSemester, setNewSemester] = useState({
    show: false,
    nama: "",
    tanggalMulai: "",
    totalSKS: "",
  })

  // Debounce timers for number inputs (keyed by sessionId-field)
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSemesters = useCallback(async () => {
    try {
      const res = await fetch("/api/kuliah/semester")
      if (!res.ok) return
      const data: SemesterData[] = await res.json()
      setSemesters(data)
      setActiveSemesterId((prev) => prev || (data.length > 0 ? data[0].id : ""))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSemesters()
  }, [fetchSemesters])

  // Clear debounce timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
    }
  }, [])

  const activeSemester = semesters.find((s) => s.id === activeSemesterId)

  // ── Optimistic session state helper ───────────────────────────────────────
  const updateSessionLocal = useCallback(
    (sessionId: string, updates: Partial<SesiKuliahData>) => {
      setSemesters((prev) =>
        prev.map((sem) => ({
          ...sem,
          mataKuliah: sem.mataKuliah.map((mk) => ({
            ...mk,
            sessions: mk.sessions.map((s) =>
              s.id === sessionId ? { ...s, ...updates } : s
            ),
          })),
        }))
      )
    },
    []
  )

  // ── Semester CRUD ─────────────────────────────────────────────────────────
  const handleCreateSemester = async () => {
    if (!newSemester.nama.trim() || !newSemester.tanggalMulai) return
    const promise = fetch("/api/kuliah/semester", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nama: newSemester.nama,
        tanggalMulai: newSemester.tanggalMulai,
        totalSKS: newSemester.totalSKS ? Number(newSemester.totalSKS) : 0,
      }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("Gagal membuat semester")
      const created: SemesterData = await res.json()
      setSemesters((prev) => [created, ...prev])
      setActiveSemesterId(created.id)
      setNewSemester({ show: false, nama: "", tanggalMulai: "", totalSKS: "" })
      return created
    })

    toast.promise(promise, {
      loading: "Membuat semester...",
      success: (data) => `Semester "${data.nama}" berhasil dibuat`,
      error: "Gagal membuat semester",
    })
  }

  const handleDeleteSemester = async (id: string) => {
    const sem = semesters.find((s) => s.id === id)
    if (!sem) return
    if (!confirm(`Hapus semester "${sem.nama}" beserta semua mata kuliah di dalamnya?`)) return

    const promise = fetch(`/api/kuliah/semester/${id}`, { method: "DELETE" }).then(async (res) => {
      if (!res.ok) throw new Error("Gagal menghapus")
      setSemesters((prev) => prev.filter((s) => s.id !== id))
      if (activeSemesterId === id) {
        setActiveSemesterId((semesters.find((s) => s.id !== id)?.id) || "")
      }
    })

    toast.promise(promise, {
      loading: "Menghapus semester...",
      success: "Semester berhasil dihapus",
      error: "Gagal menghapus semester",
    })
  }

  // ── Matkul CRUD ───────────────────────────────────────────────────────────
  const handleAddMatkul = useCallback(
    (mk: MataKuliahData) => {
      setSemesters((prev) =>
        prev.map((sem) =>
          sem.id === mk.semesterId
            ? { ...sem, mataKuliah: [...sem.mataKuliah, mk] }
            : sem
        )
      )
      toast.success(`Mata kuliah "${mk.nama}" ditambahkan`)
    },
    []
  )

  const handleEditMatkul = useCallback((mk: MataKuliahData) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === mk.semesterId
          ? {
              ...sem,
              mataKuliah: sem.mataKuliah.map((m) => (m.id === mk.id ? mk : m)),
            }
          : sem
      )
    )
    toast.success(`Mata kuliah "${mk.nama}" diperbarui`)
  }, [])

  const handleDeleteMatkul = async (id: string) => {
    if (!confirm("Hapus mata kuliah ini?")) return
    const promise = fetch(`/api/kuliah/matkul/${id}`, { method: "DELETE" }).then(async (res) => {
      if (!res.ok) throw new Error("Gagal menghapus")
      setSemesters((prev) =>
        prev.map((sem) => ({
          ...sem,
          mataKuliah: sem.mataKuliah.filter((mk) => mk.id !== id),
        }))
      )
    })

    toast.promise(promise, {
      loading: "Menghapus mata kuliah...",
      success: "Mata kuliah berhasil dihapus",
      error: "Gagal menghapus mata kuliah",
    })
  }

  // ── Session updates (optimistic) ──────────────────────────────────────────
  const handleToggleKehadiran = async (sessionId: string, current: boolean) => {
    const newVal = !current
    const session = semesters
      .flatMap((sem) => sem.mataKuliah)
      .flatMap((mk) => mk.sessions)
      .find((s) => s.id === sessionId)

    if (!session) return

    // Auto-complete logic
    const shouldComplete = newVal && (session.diskusi !== null || session.tugas !== null)
    const updates: Partial<SesiKuliahData> = { kehadiran: newVal }
    if (shouldComplete && !session.isCompleted) {
      updates.isCompleted = true
    }

    updateSessionLocal(sessionId, updates)
    
    try {
      await fetch(`/api/kuliah/session/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      toast.success(newVal ? "Kehadiran dicatat" : "Kehadiran dihapus", {
        description: shouldComplete && !session.isCompleted ? "Sesi otomatis ditandai selesai" : undefined,
        icon: newVal ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-muted-foreground" />,
      })
    } catch {
      updateSessionLocal(sessionId, { kehadiran: current, isCompleted: session.isCompleted })
      toast.error("Gagal memperbarui kehadiran")
    }
  }

  const handleToggleCompleted = async (sessionId: string, current: boolean) => {
    const newVal = !current
    updateSessionLocal(sessionId, { isCompleted: newVal })
    try {
      await fetch(`/api/kuliah/session/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: newVal }),
      })
      toast.success(newVal ? "Sesi selesai" : "Sesi belum selesai", {
        icon: newVal ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground" />,
      })
    } catch {
      updateSessionLocal(sessionId, { isCompleted: current })
      toast.error("Gagal memperbarui status sesi")
    }
  }

  const handleUpdateSession = useCallback(
    (sessionId: string, field: "diskusi" | "tugas", value: string) => {
      const numVal = value === "" ? null : Number(value)
      const session = semesters
        .flatMap(sem => sem.mataKuliah)
        .flatMap(mk => mk.sessions)
        .find(s => s.id === sessionId)
      
      if (!session) return

      // Auto-complete logic
      const updates: Partial<SesiKuliahData> = { [field]: numVal }
      const willHaveValue = numVal !== null
      if (willHaveValue && session.kehadiran && !session.isCompleted) {
        updates.isCompleted = true
      }

      updateSessionLocal(sessionId, updates)

      const key = `${sessionId}-${field}`
      const existing = debounceTimers.current.get(key)
      if (existing) clearTimeout(existing)

      debounceTimers.current.set(
        key,
        setTimeout(async () => {
          try {
            await fetch(`/api/kuliah/session/${sessionId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updates),
            })
            if (updates.isCompleted) {
              toast.success("Nilai disimpan & Sesi otomatis selesai", {
                icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              })
            }
          } catch {
            toast.error("Gagal menyimpan nilai")
          }
          debounceTimers.current.delete(key)
        }, 700)
      )
    },
    [updateSessionLocal, semesters]
  )

  // ── Compute inline tuton total (using defaults, no settings fetch) ────────
  const computeTotal = (mk: MataKuliahData) => {
    const sessions = mk.sessions || []
    const tugasSessions = parseSesiTugasList(mk.sesiTugasList || "3,5,7")
    const totalSessions = mk.jumlahSesi || 8

    const kehadiranCount = sessions.filter((s) => s.kehadiran).length
    const diskusiVals = sessions
      .filter((s) => s.diskusi !== null)
      .map((s) => s.diskusi!)
    const tugasVals = sessions
      .filter((s) => s.tugas !== null && tugasSessions.includes(s.sesiNumber))
      .map((s) => s.tugas!)

    const avgDiskusi =
      diskusiVals.length > 0
        ? diskusiVals.reduce((a, b) => a + b, 0) / diskusiVals.length
        : 0
    const avgTugas =
      tugasVals.length > 0
        ? tugasVals.reduce((a, b) => a + b, 0) / tugasVals.length
        : 0

    return (
      (kehadiranCount / totalSessions) * 20 +
      avgDiskusi * 0.3 +
      avgTugas * 0.5
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-5">
      {/* Semester Selector */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between bg-muted/20 p-4 rounded-xl border border-border/50">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Tracker Perkuliahan</h2>
          <p className="text-sm text-muted-foreground">Pantau progres kehadiran dan nilai mata kuliah Anda.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {semesters.length > 0 ? (
              <Select value={activeSemesterId} onValueChange={setActiveSemesterId}>
                <SelectTrigger className="w-56 h-10 text-sm font-medium">
                  <SelectValue placeholder="Pilih Semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-sm">
                      {s.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">Belum ada semester</p>
            )}

            {activeSemester && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    className="text-sm gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive py-2.5"
                    onClick={() => handleDeleteSemester(activeSemester.id)}
                  >
                    <Trash2 size={16} /> Hapus Semester
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5 min-h-0"
            onClick={() => setNewSemester((p) => ({ ...p, show: !p.show }))}
          >
            <PlusIcon size={14} /> Semester Baru
          </Button>
          {activeSemester && (
            <Button
              size="sm"
              className="h-9 text-xs gap-1.5 min-h-0"
              onClick={() => setAddMkOpen(true)}
            >
              <PlusIcon size={14} /> Mata Kuliah
            </Button>
          )}
        </div>
      </div>
    </div>

      {/* New Semester Form */}
      {newSemester.show && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-slide-up">
          <p className="text-sm font-medium">Buat Semester Baru</p>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <Input
              placeholder="Nama (contoh: Semester 1 2025/2026)"
              value={newSemester.nama}
              onChange={(e) =>
                setNewSemester((p) => ({ ...p, nama: e.target.value }))
              }
              className="h-9 text-sm flex-1 min-w-[180px]"
            />
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={newSemester.tanggalMulai}
                onChange={(e) =>
                  setNewSemester((p) => ({ ...p, tanggalMulai: e.target.value }))
                }
                className="h-9 text-sm w-40"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-muted-foreground shrink-0" />
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Target SKS"
                value={newSemester.totalSKS}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "")
                  setNewSemester((p) => ({ ...p, totalSKS: val }))
                }}
                className="h-9 text-sm w-28"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-9 text-xs min-h-0"
                onClick={handleCreateSemester}
                disabled={!newSemester.nama.trim() || !newSemester.tanggalMulai}
              >
                Simpan
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs min-h-0"
                onClick={() =>
                  setNewSemester({ show: false, nama: "", tanggalMulai: "", totalSKS: "" })
                }
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Semester Info Bar */}
      {activeSemester && (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <CalendarDays size={12} />
            Mulai:{" "}
            {new Date(activeSemester.tanggalMulai).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
          <SKSSummary semester={activeSemester} />
        </div>
      )}

      {/* Tracker Tables */}
      {activeSemester && activeSemester.mataKuliah?.length > 0 ? (
        <div className="space-y-4">
          {(["reguler", "praktik", "tuweb"] as const).map((jenis) => {
            const mkList = activeSemester.mataKuliah.filter(
              (mk) => mk.jenis === jenis
            )
            if (mkList.length === 0) return null
            const cfg = JENIS_CONFIG[jenis]
            return (
              <div key={jenis} className="space-y-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] uppercase tracking-wider font-bold min-h-0 min-w-0",
                    cfg.badgeClass
                  )}
                >
                  {cfg.label}
                </Badge>

                {mkList.map((mk) => (
                  <MataKuliahTable
                    key={mk.id}
                    mk={mk}
                    semester={activeSemester}
                    colLabel={cfg.colLabel}
                    onToggleKehadiran={handleToggleKehadiran}
                    onToggleCompleted={handleToggleCompleted}
                    onUpdateSession={handleUpdateSession}
                    onDelete={handleDeleteMatkul}
                    onEdit={setEditMk}
                    computeTotal={computeTotal}
                  />
                ))}
              </div>
            )
          })}
        </div>
      ) : activeSemester ? (
        <EmptyState onAdd={() => setAddMkOpen(true)} />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-xs p-12 text-center">
          <p className="text-3xl mb-2">🎓</p>
          <p className="text-sm text-muted-foreground mb-3">
            Buat semester untuk mulai tracking kuliah
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs gap-1.5 min-h-0"
            onClick={() => setNewSemester((p) => ({ ...p, show: true }))}
          >
            <PlusIcon size={14} /> Buat Semester
          </Button>
        </div>
      )}

      {/* Add Matkul Dialog */}
      {activeSemester && (
        <AddMataKuliahDialog
          open={addMkOpen}
          onOpenChange={setAddMkOpen}
          semesterId={activeSemester.id}
          onSuccess={(mk) => {
            handleAddMatkul(mk)
            setAddMkOpen(false)
          }}
        />
      )}

      {/* Edit Matkul Dialog */}
      <EditMataKuliahDialog
        open={!!editMk}
        onOpenChange={(open) => {
          if (!open) setEditMk(null)
        }}
        mataKuliah={editMk}
        onSuccess={(mk) => {
          handleEditMatkul(mk)
          setEditMk(null)
        }}
      />
    </div>
    </TooltipProvider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SKS Summary
// ─────────────────────────────────────────────────────────────────────────────
function SKSSummary({ semester }: { semester: SemesterData }) {
  const enrolled = semester.mataKuliah.reduce((sum, mk) => sum + mk.sks, 0)
  const target = semester.totalSKS

  if (target === 0) {
    return (
      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
        <TrendingUp size={11} />
        {enrolled} SKS terdaftar
      </span>
    )
  }

  const isOver = enrolled > target
  const isUnder = enrolled < target
  const isExact = enrolled === target

  return (
    <span
      className={cn(
        "text-[11px] flex items-center gap-1 font-medium",
        isExact
          ? "text-emerald-600 dark:text-emerald-400"
          : isOver
          ? "text-red-500 dark:text-red-400"
          : "text-amber-600 dark:text-amber-400"
      )}
    >
      <TrendingUp size={11} />
      {enrolled}/{target} SKS
      {isOver && " · kelebihan"}
      {isUnder && " · kurang"}
      {isExact && " · terpenuhi ✓"}
    </span>
  )
}

function MataKuliahTable({
  mk,
  semester,
  colLabel,
  onToggleKehadiran,
  onToggleCompleted,
  onUpdateSession,
  onDelete,
  onEdit,
  computeTotal,
}: {
  mk: MataKuliahData
  semester: SemesterData
  colLabel: string
  onToggleKehadiran: (id: string, current: boolean) => void
  onToggleCompleted: (id: string, current: boolean) => void
  onUpdateSession: (id: string, field: "diskusi" | "tugas", value: string) => void
  onDelete: (id: string) => void
  onEdit: (mk: MataKuliahData) => void
  computeTotal: (mk: MataKuliahData) => number
}) {
  const sessions = mk.sessions || []
  const tugasSessions = parseSesiTugasList(mk.sesiTugasList || "3,5,7")
  const total = computeTotal(mk)
  const completedCount = sessions.filter((s) => s.isCompleted).length
  const allDone = completedCount === mk.jumlahSesi

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
      {/* Header - Sticky on Mobile */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-muted/40 border-b border-border backdrop-blur-md gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5 sm:mt-0">
            <BookOpen size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {mk.kode}
              </span>
              <Badge
                variant="outline"
                className="text-[9px] h-4 px-1.5 border-border text-muted-foreground shrink-0"
              >
                {mk.sks} SKS
              </Badge>
            </div>
            <h3 className="text-sm font-bold text-foreground leading-tight truncate sm:whitespace-normal sm:line-clamp-2">
              {mk.nama}
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
          <div className="flex items-center gap-3">
            {/* Completion progress */}
            <div className="flex flex-col items-end sm:items-center">
              <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-tighter sm:hidden">Progres</span>
              <span
                className={cn(
                  "text-[10px] tabular-nums font-bold px-2 py-0.5 rounded-full",
                  allDone
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted-foreground/10 text-muted-foreground"
                )}
              >
                {completedCount}/{mk.jumlahSesi}
              </span>
            </div>
            {/* Tuton score */}
            <div className="flex flex-col items-end sm:items-center">
              <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-tighter sm:hidden">Skor</span>
              <span className="text-sm font-black tabular-nums text-primary">
                {total.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="h-8 w-px bg-border/60 mx-1 hidden sm:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Opsi mata kuliah" className="h-8 w-8 min-h-0 min-w-0 rounded-full flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="text-xs gap-2 cursor-pointer py-2"
                onClick={() => onEdit(mk)}
              >
                <Edit size={14} className="text-muted-foreground" /> Edit Mata Kuliah
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-2 cursor-pointer py-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => onDelete(mk.id)}
              >
                <Trash2 size={14} /> Hapus Mata Kuliah
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border">
        <table className="w-full text-xs border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/30">
              <th className="sticky left-0 z-20 bg-card/95 backdrop-blur-sm px-4 py-3 text-left font-bold text-muted-foreground border-b border-r border-border w-28 min-w-28">
                KOMPONEN
              </th>
              {sessions.map((s, i) => (
                <th
                  key={s.id}
                  className={cn(
                    "px-3 py-3 text-center font-medium border-b border-border min-w-[85px]",
                    s.isCompleted ? "bg-emerald-500/10" : "bg-muted/20"
                  )}
                >
                  <div className="text-[10px] font-black text-foreground uppercase tracking-tight">
                    {colLabel} {i + 1}
                  </div>
                  <div className="text-[9px] text-muted-foreground/80 font-medium">
                    {getSessionDateRange(semester.tanggalMulai, i + 1)}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center font-bold text-primary min-w-[70px] bg-primary/5 border-b border-border">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {/* Selesai Row */}
            <tr className="hover:bg-muted/5 transition-colors group">
              <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-2.5 font-bold text-muted-foreground text-[10px] uppercase tracking-wider border-r border-border">
                Selesai
              </td>
              {sessions.map((s) => (
                <td
                  key={s.id}
                  className={cn(
                    "px-3 py-2.5 text-center transition-colors",
                    s.isCompleted && "bg-emerald-500/5"
                  )}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={s.isCompleted ? "Tandai belum selesai" : "Tandai selesai"}
                        onClick={() => onToggleCompleted(s.id, s.isCompleted)}
                        className={cn(
                          "h-6 w-6 min-h-0 min-w-0 rounded-full flex items-center justify-center mx-auto transition-all duration-300 transform active:scale-90",
                          s.isCompleted
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                            : "bg-muted text-muted-foreground/30 hover:bg-muted-foreground/20 hover:text-muted-foreground"
                        )}
                      >
                        {s.isCompleted ? (
                          <CheckCircle2 size={14} strokeWidth={3} />
                        ) : (
                          <Circle size={14} strokeWidth={2} />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-[10px]">{s.isCompleted ? "Tandai Belum Selesai" : "Tandai Selesai"}</p>
                    </TooltipContent>
                  </Tooltip>
                </td>
              ))}
              <td className="px-4 py-2.5 text-center bg-primary/5 font-bold tabular-nums">
                <span
                  className={cn(
                    "text-[11px]",
                    allDone
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-primary"
                  )}
                >
                  {completedCount}/{mk.jumlahSesi}
                </span>
              </td>
            </tr>

            {/* Kehadiran Row */}
            <tr className="hover:bg-muted/5 transition-colors group">
              <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-2.5 font-bold text-muted-foreground text-[10px] uppercase tracking-wider border-r border-border">
                Kehadiran
              </td>
              {sessions.map((s) => (
                <td
                  key={s.id}
                  className={cn(
                    "px-3 py-2.5 text-center transition-colors",
                    s.isCompleted && "bg-emerald-500/5"
                  )}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={s.kehadiran ? "Tandai tidak hadir" : "Tandai hadir"}
                        onClick={() => onToggleKehadiran(s.id, s.kehadiran)}
                        className={cn(
                          "h-8 w-8 min-h-0 min-w-0 rounded-lg flex items-center justify-center mx-auto transition-all duration-300 transform active:scale-90",
                          s.kehadiran
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm"
                            : "bg-muted text-muted-foreground/40 hover:bg-muted-foreground/10 hover:text-muted-foreground border border-transparent"
                        )}
                      >
                        {s.kehadiran ? (
                          <Check size={16} strokeWidth={3} />
                        ) : (
                          <X size={14} strokeWidth={2.5} />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-[10px]">{s.kehadiran ? "Hapus Kehadiran" : "Catat Kehadiran"}</p>
                    </TooltipContent>
                  </Tooltip>
                </td>
              ))}
              <td className="px-4 py-2.5 text-center bg-primary/5 font-bold tabular-nums text-primary text-[11px]">
                {sessions.filter((s) => s.kehadiran).length}/{mk.jumlahSesi}
              </td>
            </tr>

            {/* Diskusi Row */}
            <tr className="hover:bg-muted/5 transition-colors group">
              <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-2.5 font-bold text-muted-foreground text-[10px] uppercase tracking-wider border-r border-border">
                Diskusi
              </td>
              {sessions.map((s) => (
                <td
                  key={s.id}
                  className={cn(
                    "px-2 py-2.5 text-center transition-colors",
                    s.isCompleted && "bg-emerald-500/5"
                  )}
                >
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={s.diskusi ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "")
                      const parts = val.split(".")
                      const sanitized = parts[0] + (parts.length > 1 ? "." + parts[1].slice(0, 2) : "")
                      onUpdateSession(s.id, "diskusi", sanitized)
                    }}
                    className="h-8 w-14 text-[11px] font-bold text-center placeholder:text-center mx-auto tabular-nums min-h-0 px-1 bg-background focus:ring-1 focus:ring-primary border-muted-foreground/20"
                    placeholder="—"
                  />
                </td>
              ))}
              <td className="px-4 py-2.5 text-center bg-primary/5 font-bold tabular-nums text-primary text-[11px]">
                {(() => {
                  const vals = sessions
                    .filter((s) => s.diskusi !== null)
                    .map((s) => s.diskusi!)
                  return vals.length > 0
                    ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                    : "—"
                })()}
              </td>
            </tr>

            {/* Tugas Row */}
            <tr className="hover:bg-muted/5 transition-colors group">
              <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-2.5 font-bold text-muted-foreground text-[10px] uppercase tracking-wider border-r border-border">
                Tugas
              </td>
              {sessions.map((s) => {
                const isTugasSesi = tugasSessions.includes(s.sesiNumber)
                return (
                  <td
                    key={s.id}
                    className={cn(
                      "px-2 py-2.5 text-center transition-colors",
                      s.isCompleted && "bg-emerald-500/5"
                    )}
                  >
                    {isTugasSesi ? (
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={s.tugas ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, "")
                          const parts = val.split(".")
                          const sanitized = parts[0] + (parts.length > 1 ? "." + parts[1].slice(0, 2) : "")
                          onUpdateSession(s.id, "tugas", sanitized)
                        }}
                        className="h-8 w-14 text-[11px] font-bold text-center placeholder:text-center mx-auto tabular-nums min-h-0 px-1 bg-background focus:ring-1 focus:ring-primary border-muted-foreground/20"
                        placeholder="—"
                      />
                    ) : (
                      <div className="h-8 flex items-center justify-center">
                        <span className="text-muted-foreground/20 text-[10px]">—</span>
                      </div>
                    )}
                  </td>
                )
              })}
              <td className="px-4 py-2.5 text-center bg-primary/5 font-bold tabular-nums text-primary text-[11px]">
                {(() => {
                  const vals = sessions
                    .filter(
                      (s) =>
                        s.tugas !== null && tugasSessions.includes(s.sesiNumber)
                    )
                    .map((s) => s.tugas!)
                  return vals.length > 0
                    ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                    : "—"
                })()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs p-12 text-center">
      <p className="text-3xl mb-2">📚</p>
      <p className="text-sm text-muted-foreground mb-3">
        Belum ada mata kuliah di semester ini
      </p>
      <Button
        size="sm"
        variant="outline"
        className="h-9 text-xs gap-1.5 min-h-0"
        onClick={onAdd}
      >
        <PlusIcon size={14} /> Tambah Mata Kuliah
      </Button>
    </div>
  )
}
