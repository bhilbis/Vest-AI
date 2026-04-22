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
    try {
      const res = await fetch("/api/kuliah/semester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: newSemester.nama,
          tanggalMulai: newSemester.tanggalMulai,
          totalSKS: newSemester.totalSKS ? Number(newSemester.totalSKS) : 0,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const created: SemesterData = await res.json()
      setSemesters((prev) => [created, ...prev])
      setActiveSemesterId(created.id)
      setNewSemester({ show: false, nama: "", tanggalMulai: "", totalSKS: "" })
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteSemester = async (id: string) => {
    if (!confirm("Hapus semester beserta semua mata kuliah di dalamnya?")) return
    try {
      await fetch(`/api/kuliah/semester/${id}`, { method: "DELETE" })
      setSemesters((prev) => prev.filter((s) => s.id !== id))
      if (activeSemesterId === id) {
        setActiveSemesterId((semesters.find((s) => s.id !== id)?.id) || "")
      }
    } catch (e) {
      console.error(e)
    }
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
  }, [])

  const handleDeleteMatkul = async (id: string) => {
    if (!confirm("Hapus mata kuliah ini?")) return
    try {
      await fetch(`/api/kuliah/matkul/${id}`, { method: "DELETE" })
      setSemesters((prev) =>
        prev.map((sem) => ({
          ...sem,
          mataKuliah: sem.mataKuliah.filter((mk) => mk.id !== id),
        }))
      )
    } catch (e) {
      console.error(e)
    }
  }

  // ── Session updates (optimistic) ──────────────────────────────────────────
  const handleToggleKehadiran = async (sessionId: string, current: boolean) => {
    updateSessionLocal(sessionId, { kehadiran: !current })
    try {
      await fetch(`/api/kuliah/session/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kehadiran: !current }),
      })
    } catch {
      updateSessionLocal(sessionId, { kehadiran: current })
    }
  }

  const handleToggleCompleted = async (sessionId: string, current: boolean) => {
    updateSessionLocal(sessionId, { isCompleted: !current })
    try {
      await fetch(`/api/kuliah/session/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !current }),
      })
    } catch {
      updateSessionLocal(sessionId, { isCompleted: current })
    }
  }

  const handleUpdateSession = useCallback(
    (sessionId: string, field: "diskusi" | "tugas", value: string) => {
      const numVal = value === "" ? null : Number(value)
      updateSessionLocal(sessionId, { [field]: numVal })

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
              body: JSON.stringify({ [field]: numVal }),
            })
          } catch {
            // silent — will reconcile on next page load
          }
          debounceTimers.current.delete(key)
        }, 700)
      )
    },
    [updateSessionLocal]
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
    <div className="space-y-5">
      {/* Semester Selector */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {semesters.length > 0 ? (
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
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada semester</p>
          )}

          {activeSemester && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Opsi semester" className="h-8 w-8 min-h-0 min-w-0 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem
                  className="text-xs gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => handleDeleteSemester(activeSemester.id)}
                >
                  <Trash2 size={12} /> Hapus Semester
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
                type="number"
                min={0}
                max={30}
                placeholder="Target SKS"
                value={newSemester.totalSKS}
                onChange={(e) =>
                  setNewSemester((p) => ({ ...p, totalSKS: e.target.value }))
                }
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

// ─────────────────────────────────────────────────────────────────────────────
// Mata Kuliah Table
// ─────────────────────────────────────────────────────────────────────────────
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
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={14} className="text-primary shrink-0" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
            {mk.kode}
          </span>
          <span className="text-sm font-semibold text-foreground truncate">
            {mk.nama}
          </span>
          <Badge
            variant="outline"
            className="text-[9px] min-h-0 min-w-0 border-border text-muted-foreground shrink-0"
          >
            {mk.sks} SKS
          </Badge>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Completion progress */}
          <span
            className={cn(
              "text-[10px] tabular-nums font-medium px-1.5 py-0.5 rounded",
              allDone
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"
            )}
          >
            {completedCount}/{mk.jumlahSesi} selesai
          </span>
          {/* Tuton score */}
          <span className="text-sm font-bold tabular-nums text-primary">
            {total.toFixed(1)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Opsi mata kuliah" className="h-7 w-7 min-h-0 min-w-0 rounded flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                className="text-xs gap-2 cursor-pointer"
                onClick={() => onEdit(mk)}
              >
                <Edit size={12} /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => onDelete(mk.id)}
              >
                <Trash2 size={12} /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scrollable Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium text-muted-foreground w-24 min-w-[96px]">
                Komponen
              </th>
              {sessions.map((s, i) => (
                <th
                  key={s.id}
                  className={cn(
                    "px-2 py-2 text-center font-medium text-muted-foreground min-w-[80px]",
                    s.isCompleted && "bg-emerald-500/5"
                  )}
                >
                  <div className="text-[11px] font-bold text-foreground">
                    {colLabel} {i + 1}
                  </div>
                  <div className="text-[9px] text-muted-foreground/70">
                    {getSessionDateRange(semester.tanggalMulai, i + 1)}
                  </div>
                </th>
              ))}
              <th className="px-3 py-2 text-center font-bold text-foreground min-w-[60px] bg-muted/30">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Selesai Row */}
            <tr className="border-b border-border/50 hover:bg-muted/10 transition-colors">
              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-muted-foreground text-[11px]">
                Selesai
              </td>
              {sessions.map((s) => (
                <td
                  key={s.id}
                  className={cn(
                    "px-2 py-1.5 text-center",
                    s.isCompleted && "bg-emerald-500/5"
                  )}
                >
                  <button
                    type="button"
                    aria-label={s.isCompleted ? "Tandai belum selesai" : "Tandai selesai"}
                    onClick={() => onToggleCompleted(s.id, s.isCompleted)}
                    className={cn(
                      "h-6 w-6 min-h-0 min-w-0 rounded-full flex items-center justify-center mx-auto transition-all duration-200",
                      s.isCompleted
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-muted/50 text-muted-foreground/30 hover:bg-muted hover:text-muted-foreground"
                    )}
                  >
                    {s.isCompleted ? (
                      <CheckCircle2 size={13} strokeWidth={2.5} />
                    ) : (
                      <Circle size={13} strokeWidth={1.5} />
                    )}
                  </button>
                </td>
              ))}
              <td className="px-3 py-1.5 text-center bg-muted/10">
                <span
                  className={cn(
                    "text-[11px] font-semibold tabular-nums",
                    allDone
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground"
                  )}
                >
                  {completedCount}/{mk.jumlahSesi}
                </span>
              </td>
            </tr>

            {/* Kehadiran Row */}
            <tr className="border-b border-border/50 hover:bg-muted/10 transition-colors">
              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-muted-foreground">
                Kehadiran
              </td>
              {sessions.map((s) => (
                <td
                  key={s.id}
                  className={cn(
                    "px-2 py-1.5 text-center",
                    s.isCompleted && "bg-emerald-500/5"
                  )}
                >
                  <button
                    type="button"
                    aria-label={s.kehadiran ? "Tandai tidak hadir" : "Tandai hadir"}
                    onClick={() => onToggleKehadiran(s.id, s.kehadiran)}
                    className={cn(
                      "h-7 w-7 min-h-0 min-w-0 rounded-md flex items-center justify-center mx-auto transition-all duration-200",
                      s.kehadiran
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-muted text-muted-foreground/40 hover:bg-muted/80 hover:text-muted-foreground"
                    )}
                  >
                    {s.kehadiran ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <X size={12} strokeWidth={2} />
                    )}
                  </button>
                </td>
              ))}
              <td className="px-3 py-1.5 text-center bg-muted/10">
                <span className="text-[11px] font-semibold tabular-nums text-foreground">
                  {sessions.filter((s) => s.kehadiran).length}/{mk.jumlahSesi}
                </span>
              </td>
            </tr>

            {/* Diskusi Row */}
            <tr className="border-b border-border/50 hover:bg-muted/10 transition-colors">
              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-muted-foreground">
                Diskusi
              </td>
              {sessions.map((s) => (
                <td
                  key={s.id}
                  className={cn(
                    "px-1 py-1.5 text-center",
                    s.isCompleted && "bg-emerald-500/5"
                  )}
                >
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={s.diskusi ?? ""}
                    onChange={(e) =>
                      onUpdateSession(s.id, "diskusi", e.target.value)
                    }
                    className="h-7 w-14 text-[11px] text-center mx-auto tabular-nums min-h-0 px-1"
                    placeholder="—"
                  />
                </td>
              ))}
              <td className="px-3 py-1.5 text-center bg-muted/10">
                <span className="text-[11px] font-semibold tabular-nums text-foreground">
                  {(() => {
                    const vals = sessions
                      .filter((s) => s.diskusi !== null)
                      .map((s) => s.diskusi!)
                    return vals.length > 0
                      ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                      : "—"
                  })()}
                </span>
              </td>
            </tr>

            {/* Tugas Row */}
            <tr className="hover:bg-muted/10 transition-colors">
              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-muted-foreground">
                Tugas
              </td>
              {sessions.map((s) => {
                const isTugasSesi = tugasSessions.includes(s.sesiNumber)
                return (
                  <td
                    key={s.id}
                    className={cn(
                      "px-1 py-1.5 text-center",
                      s.isCompleted && "bg-emerald-500/5"
                    )}
                  >
                    {isTugasSesi ? (
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={s.tugas ?? ""}
                        onChange={(e) =>
                          onUpdateSession(s.id, "tugas", e.target.value)
                        }
                        className="h-7 w-14 text-[11px] text-center mx-auto tabular-nums min-h-0 px-1"
                        placeholder="—"
                      />
                    ) : (
                      <span className="text-muted-foreground/30 text-[10px]">—</span>
                    )}
                  </td>
                )
              })}
              <td className="px-3 py-1.5 text-center bg-muted/10">
                <span className="text-[11px] font-semibold tabular-nums text-foreground">
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
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────
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
