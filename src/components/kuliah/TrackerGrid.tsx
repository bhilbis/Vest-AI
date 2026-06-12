"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  CheckCircle2,
  TrendingUp,
  MessageSquarePlus,
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
  getSessionStatus,
  getLetterGradeFromBoundaries,
  getGradeColor,
} from "@/lib/kuliah-types"
import { cn } from "@/lib/utils"
import { useKuliahLayout } from "@/app/(protected)/kuliah/layout"
import { useIsMobile } from "@/hooks/use-mobile"

// ─────────────────────────────────────────────────────────────────────────────
const JENIS_CONFIG: Record<string, { label: string; colLabel: string; badgeClass: string }> = {
  reguler: { label: "Reguler",  colLabel: "Sesi",      badgeClass: "border-primary/30 text-primary bg-primary/5" },
  praktik: { label: "Praktik",  colLabel: "Sesi",      badgeClass: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5" },
  tuweb:   { label: "Tuweb",    colLabel: "Aktivitas", badgeClass: "border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5" },
}

// ─────────────────────────────────────────────────────────────────────────────
export function TrackerGrid() {
  const [semesters, setSemesters] = useState<SemesterData[]>([])
  const [activeSemesterId, setActiveSemesterId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [addMkOpen, setAddMkOpen] = useState(false)
  const [editMk, setEditMk] = useState<MataKuliahData | null>(null)
  const [activeMobileSession, setActiveMobileSession] = useState(1)
  const [mobileView, setMobileView] = useState<"minggu-ini" | "semua-sesi">("minggu-ini")
  const isMobile = useIsMobile()
  const [newSemester, setNewSemester] = useState({
    show: false, nama: "", tanggalMulai: "", totalSKS: "",
  })

  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

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

  useEffect(() => { fetchSemesters() }, [fetchSemesters])

  useEffect(() => {
    if (!activeSemester) return
    const maxSesi = Math.max(...activeSemester.mataKuliah.map((mk) => mk.jumlahSesi), 8)
    const start = new Date(activeSemester.tanggalMulai)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const current = Math.max(1, Math.min(Math.floor(diffDays / 7) + 1, maxSesi))
    setActiveMobileSession(current)
  }, [activeSemesterId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timers = debounceTimers.current
    return () => { timers.forEach((t) => clearTimeout(t)) }
  }, [])

  const activeSemester = semesters.find((s) => s.id === activeSemesterId)

  const updateSessionLocal = useCallback((sessionId: string, updates: Partial<SesiKuliahData>) => {
    setSemesters((prev) =>
      prev.map((sem) => ({
        ...sem,
        mataKuliah: sem.mataKuliah.map((mk) => ({
          ...mk,
          sessions: mk.sessions.map((s) => s.id === sessionId ? { ...s, ...updates } : s),
        })),
      }))
    )
  }, [])

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
      success: (d) => `Semester "${d.nama}" berhasil dibuat`,
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
      if (activeSemesterId === id)
        setActiveSemesterId((semesters.find((s) => s.id !== id)?.id) || "")
    })
    toast.promise(promise, {
      loading: "Menghapus semester...",
      success: "Semester berhasil dihapus",
      error: "Gagal menghapus semester",
    })
  }

  // ── Matkul CRUD ───────────────────────────────────────────────────────────
  const handleAddMatkul = useCallback((mk: MataKuliahData) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === mk.semesterId ? { ...sem, mataKuliah: [...sem.mataKuliah, mk] } : sem
      )
    )
    toast.success(`"${mk.nama}" ditambahkan`)
  }, [])

  const handleEditMatkul = useCallback((mk: MataKuliahData) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === mk.semesterId
          ? { ...sem, mataKuliah: sem.mataKuliah.map((m) => (m.id === mk.id ? mk : m)) }
          : sem
      )
    )
    toast.success(`"${mk.nama}" diperbarui`)
  }, [])

  const handleDeleteMatkul = async (id: string) => {
    if (!confirm("Hapus mata kuliah ini?")) return
    const promise = fetch(`/api/kuliah/matkul/${id}`, { method: "DELETE" }).then(async (res) => {
      if (!res.ok) throw new Error("Gagal menghapus")
      setSemesters((prev) =>
        prev.map((sem) => ({ ...sem, mataKuliah: sem.mataKuliah.filter((mk) => mk.id !== id) }))
      )
    })
    toast.promise(promise, {
      loading: "Menghapus...",
      success: "Mata kuliah dihapus",
      error: "Gagal menghapus",
    })
  }

  // ── Session updates ───────────────────────────────────────────────────────
  const handleToggleKehadiran = async (sessionId: string, current: boolean) => {
    const newVal = !current
    updateSessionLocal(sessionId, { kehadiran: newVal })
    try {
      await fetch(`/api/kuliah/session/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kehadiran: newVal }),
      })
    } catch {
      updateSessionLocal(sessionId, { kehadiran: current })
      toast.error("Gagal memperbarui kehadiran")
    }
  }

  const handleToggleNA = async (sessionId: string, field: "diskusi" | "tugas", currentNA: boolean) => {
    const newNA = !currentNA
    const naField = field === "diskusi" ? "diskusiNA" : "tugasNA"
    const clearValue = newNA ? { [field]: null } : {}
    updateSessionLocal(sessionId, { [naField]: newNA, ...clearValue })
    try {
      await fetch(`/api/kuliah/session/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [naField]: newNA, ...(newNA ? { [field]: null } : {}) }),
      })
    } catch {
      updateSessionLocal(sessionId, { [naField]: currentNA })
      toast.error("Gagal memperbarui")
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
            toast.error("Gagal menyimpan nilai")
          }
          debounceTimers.current.delete(key)
        }, 700)
      )
    },
    [updateSessionLocal]
  )

  const computeTotal = (mk: MataKuliahData) => {
    const sessions = mk.sessions || []
    const totalSessions = mk.jumlahSesi || 8
    const kehadiranCount = sessions.filter((s) => s.kehadiran).length
    const diskusiVals = sessions.filter((s) => s.diskusi !== null && !s.hasTugas && !s.diskusiNA).map((s) => s.diskusi!)
    const tugasVals = sessions.filter((s) => s.tugas !== null && s.hasTugas && !s.tugasNA).map((s) => s.tugas!)
    const avgDiskusi = diskusiVals.length > 0 ? diskusiVals.reduce((a, b) => a + b, 0) / diskusiVals.length : 0
    const avgTugas = tugasVals.length > 0 ? tugasVals.reduce((a, b) => a + b, 0) / tugasVals.length : 0
    return (kehadiranCount / totalSessions) * 20 + avgDiskusi * 0.3 + avgTugas * 0.5
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        {/* ── Semester Selector Bar ──────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Tracker Perkuliahan</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pantau sesi & nilai mata kuliah.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {semesters.length > 0 ? (
              <Select value={activeSemesterId} onValueChange={setActiveSemesterId}>
                <SelectTrigger className="w-52 h-9 text-sm font-medium">
                  <SelectValue placeholder="Pilih Semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-sm">{s.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-muted-foreground">Belum ada semester</span>
            )}

            {activeSemester && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuItem
                    className="text-xs gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive py-2"
                    onClick={() => handleDeleteSemester(activeSemester.id)}
                  >
                    <Trash2 size={14} /> Hapus Semester
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5"
                onClick={() => setNewSemester((p) => ({ ...p, show: !p.show }))}>
                <PlusIcon size={13} /> Semester
              </Button>
              {activeSemester && (
                <Button size="sm" className="h-9 text-xs gap-1.5" onClick={() => setAddMkOpen(true)}>
                  <PlusIcon size={13} /> Mata Kuliah
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── New Semester Form ──────────────────────────────────────── */}
        {newSemester.show && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-slide-up">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semester Baru</p>
            <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
              <Input
                placeholder="Nama (mis. Semester 1 2025/2026)"
                value={newSemester.nama}
                onChange={(e) => setNewSemester((p) => ({ ...p, nama: e.target.value }))}
                className="h-9 text-sm flex-1 min-w-[200px]"
              />
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-muted-foreground shrink-0" />
                <Input type="date" value={newSemester.tanggalMulai}
                  onChange={(e) => setNewSemester((p) => ({ ...p, tanggalMulai: e.target.value }))}
                  className="h-9 text-sm w-40" />
              </div>
              <Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Target SKS"
                value={newSemester.totalSKS}
                onChange={(e) => setNewSemester((p) => ({ ...p, totalSKS: e.target.value.replace(/[^0-9]/g, "") }))}
                className="h-9 text-sm w-28" />
              <div className="flex gap-2">
                <Button size="sm" className="h-9 text-xs" onClick={handleCreateSemester}
                  disabled={!newSemester.nama.trim() || !newSemester.tanggalMulai}>Simpan</Button>
                <Button variant="ghost" size="sm" className="h-9 text-xs"
                  onClick={() => setNewSemester({ show: false, nama: "", tanggalMulai: "", totalSKS: "" })}>
                  Batal
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Semester Info ─────────────────────────────────────────── */}
        {activeSemester && (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CalendarDays size={11} />
              {new Date(activeSemester.tanggalMulai).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
            <SKSSummary semester={activeSemester} />
          </div>
        )}

        {/* ── Tracker Content ───────────────────────────────────────── */}
        {activeSemester && activeSemester.mataKuliah?.length > 0 ? (
          <>
            {/* Mobile */}
            <div className="sm:hidden space-y-3">
              <div className="flex rounded-xl border border-border bg-muted/30 p-1 gap-1">
                {(["minggu-ini", "semua-sesi"] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setMobileView(v)}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-[12px] font-semibold transition-all",
                      mobileView === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}>
                    {v === "minggu-ini" ? "Minggu Ini" : "Semua Sesi"}
                  </button>
                ))}
              </div>

              {mobileView === "semua-sesi" && (
                <MobileSessionChips semester={activeSemester} activeSession={activeMobileSession} onSelectSession={setActiveMobileSession} />
              )}
              {mobileView === "minggu-ini" && (
                <MingguIniBanner semester={activeSemester} activeSession={activeMobileSession} />
              )}

              {(["reguler", "praktik", "tuweb"] as const).map((jenis) => {
                const mkList = activeSemester.mataKuliah.filter((mk) => mk.jenis === jenis)
                if (mkList.length === 0) return null
                const cfg = JENIS_CONFIG[jenis]
                return (
                  <div key={jenis} className="space-y-2.5">
                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold", cfg.badgeClass)}>
                      {cfg.label}
                    </Badge>
                    {mkList.map((mk) => (
                      <MobileMataKuliahCard key={mk.id} mk={mk} semester={activeSemester}
                        activeSession={activeMobileSession}
                        onToggleKehadiran={handleToggleKehadiran}
                        onToggleNA={handleToggleNA}
                        onUpdateSession={handleUpdateSession}
                        onEdit={setEditMk}
                        onDelete={handleDeleteMatkul}
                        computeTotal={computeTotal}
                      />
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Desktop */}
            <div className="hidden sm:block space-y-4">
              {(["reguler", "praktik", "tuweb"] as const).map((jenis) => {
                const mkList = activeSemester.mataKuliah.filter((mk) => mk.jenis === jenis)
                if (mkList.length === 0) return null
                const cfg = JENIS_CONFIG[jenis]
                return (
                  <div key={jenis} className="space-y-3">
                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold", cfg.badgeClass)}>
                      {cfg.label}
                    </Badge>
                    {mkList.map((mk) => (
                      <MataKuliahTable key={mk.id} mk={mk} semester={activeSemester}
                        colLabel={cfg.colLabel}
                        onToggleKehadiran={handleToggleKehadiran}
                        onToggleNA={handleToggleNA}
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
          </>
        ) : activeSemester ? (
          <EmptyState onAdd={() => setAddMkOpen(true)} />
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen size={20} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Belum ada semester</p>
            <p className="text-xs text-muted-foreground mb-4">Buat semester untuk mulai tracking kuliah</p>
            <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5"
              onClick={() => setNewSemester((p) => ({ ...p, show: true }))}>
              <PlusIcon size={13} /> Buat Semester
            </Button>
          </div>
        )}

        {activeSemester && (
          <AddMataKuliahDialog open={addMkOpen} onOpenChange={setAddMkOpen}
            semesterId={activeSemester.id}
            onSuccess={(mk) => { handleAddMatkul(mk); setAddMkOpen(false) }}
          />
        )}

        <EditMataKuliahDialog open={!!editMk} onOpenChange={(open) => { if (!open) setEditMk(null) }}
          mataKuliah={editMk}
          onSuccess={(mk) => { handleEditMatkul(mk); setEditMk(null) }}
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
        <TrendingUp size={11} />{enrolled} SKS
      </span>
    )
  }
  const isOver = enrolled > target
  const isExact = enrolled === target
  return (
    <span className={cn("text-[11px] flex items-center gap-1 font-medium",
      isExact ? "text-emerald-600 dark:text-emerald-400"
      : isOver ? "text-red-500" : "text-amber-600 dark:text-amber-400")}>
      <TrendingUp size={11} />
      {enrolled}/{target} SKS{isOver && " · lebih"}{isExact && " ✓"}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared number input for diskusi/tugas
// ─────────────────────────────────────────────────────────────────────────────
function SessionNumberInput({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: string) => void
}) {
  return (
    <Input
      type="text"
      inputMode="decimal"
      value={value ?? ""}
      onChange={(e) => {
        const val = e.target.value.replace(/[^0-9.]/g, "")
        const parts = val.split(".")
        onChange(parts[0] + (parts.length > 1 ? "." + parts[1].slice(0, 2) : ""))
      }}
      className="h-8 w-14 text-[11px] font-bold text-center tabular-nums min-h-0 px-1 bg-background focus:ring-1 focus:ring-primary border-muted-foreground/20"
      placeholder="—"
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DiskusiCell — handles the three tuweb states cleanly
// ─────────────────────────────────────────────────────────────────────────────
function DiskusiCell({
  session,
  isTuweb,
  onToggleNA,
  onUpdateSession,
}: {
  session: SesiKuliahData
  isTuweb: boolean
  onToggleNA: (id: string, field: "diskusi" | "tugas", currentNA: boolean) => void
  onUpdateSession: (id: string, field: "diskusi" | "tugas", value: string) => void
}) {
  if (session.hasTugas) {
    return <div className="h-8 flex items-center justify-center"><span className="text-muted-foreground/25 text-xs">—</span></div>
  }

  // Tuweb: session configured as "no diskusi" (diskusiNA=true, no input)
  if (isTuweb && session.diskusiNA) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <div className="h-8 w-14 flex items-center justify-center">
          <span className="text-muted-foreground/25 text-xs">—</span>
        </div>
        <button type="button" onClick={() => onToggleNA(session.id, "diskusi", true)}
          className="text-[8px] text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors leading-none">
          isi
        </button>
      </div>
    )
  }

  // Normal: show input + N/A toggle
  return (
    <div className="flex flex-col items-center gap-0.5">
      {session.diskusiNA ? (
        <button type="button" onClick={() => onToggleNA(session.id, "diskusi", true)}
          className="h-8 w-14 rounded text-[10px] font-bold text-muted-foreground/40 bg-muted/40 border border-dashed border-muted-foreground/15 hover:border-muted-foreground/30 transition-colors">
          N/A
        </button>
      ) : (
        <SessionNumberInput value={session.diskusi}
          onChange={(v) => onUpdateSession(session.id, "diskusi", v)} />
      )}
      <button type="button" onClick={() => onToggleNA(session.id, "diskusi", session.diskusiNA)}
        className="text-[8px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors leading-none">
        {session.diskusiNA ? "isi" : "N/A"}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TugasCell
// ─────────────────────────────────────────────────────────────────────────────
function TugasCell({
  session,
  onToggleNA,
  onUpdateSession,
}: {
  session: SesiKuliahData
  onToggleNA: (id: string, field: "diskusi" | "tugas", currentNA: boolean) => void
  onUpdateSession: (id: string, field: "diskusi" | "tugas", value: string) => void
}) {
  if (!session.hasTugas) {
    return <div className="h-8 flex items-center justify-center"><span className="text-muted-foreground/25 text-xs">—</span></div>
  }
  return (
    <div className="flex flex-col items-center gap-0.5">
      {session.tugasNA ? (
        <button type="button" onClick={() => onToggleNA(session.id, "tugas", true)}
          className="h-8 w-14 rounded text-[10px] font-bold text-muted-foreground/40 bg-muted/40 border border-dashed border-muted-foreground/15 hover:border-muted-foreground/30 transition-colors">
          N/A
        </button>
      ) : (
        <SessionNumberInput value={session.tugas}
          onChange={(v) => onUpdateSession(session.id, "tugas", v)} />
      )}
      <button type="button" onClick={() => onToggleNA(session.id, "tugas", session.tugasNA)}
        className="text-[8px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors leading-none">
        {session.tugasNA ? "isi" : "N/A"}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MataKuliahTable (Desktop)
// ─────────────────────────────────────────────────────────────────────────────
function MataKuliahTable({
  mk, semester, colLabel,
  onToggleKehadiran, onToggleNA, onUpdateSession, onDelete, onEdit, computeTotal,
}: {
  mk: MataKuliahData
  semester: SemesterData
  colLabel: string
  onToggleKehadiran: (id: string, current: boolean) => void
  onToggleNA: (id: string, field: "diskusi" | "tugas", currentNA: boolean) => void
  onUpdateSession: (id: string, field: "diskusi" | "tugas", value: string) => void
  onDelete: (id: string) => void
  onEdit: (mk: MataKuliahData) => void
  computeTotal: (mk: MataKuliahData) => number
}) {
  const kuliahLayout = useKuliahLayout()
  const sessions = mk.sessions || []
  const total = computeTotal(mk)
  const completedCount = sessions.filter((s) => getSessionStatus(s, semester.tanggalMulai) === "done").length
  const isTuweb = mk.jenis === "tuweb"

  // Averages for total column
  const diskusiVals = sessions.filter((s) => s.diskusi !== null && !s.hasTugas && !s.diskusiNA).map((s) => s.diskusi!)
  const tugasVals = sessions.filter((s) => s.tugas !== null && s.hasTugas && !s.tugasNA).map((s) => s.tugas!)
  const avgDiskusi = diskusiVals.length > 0 ? diskusiVals.reduce((a, b) => a + b, 0) / diskusiVals.length : null
  const avgTugas = tugasVals.length > 0 ? tugasVals.reduce((a, b) => a + b, 0) / tugasVals.length : null

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-muted/30 border-b border-border gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <BookOpen size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">{mk.kode}</span>
              <span className="text-[9px] text-muted-foreground/50 border border-border/60 rounded px-1">{mk.sks} SKS</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground leading-tight truncate">{mk.nama}</h3>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className={cn("text-[10px] tabular-nums font-bold px-2 py-0.5 rounded-full",
              completedCount === mk.jumlahSesi
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-muted text-muted-foreground")}>
              {completedCount}/{mk.jumlahSesi}
            </span>
            <span className="text-base font-black tabular-nums text-primary">{total.toFixed(1)}</span>
          </div>
          <div className="w-px h-6 bg-border/60" />
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => { kuliahLayout.setIsChatOpen(true); toast.success("Ditambahkan ke konteks AI") }}>
                  <MessageSquarePlus size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-[10px]">Tambah ke konteks AI</p></TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Opsi mata kuliah" className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem className="text-xs gap-2 cursor-pointer py-2" onClick={() => onEdit(mk)}>
                  <Edit size={13} className="text-muted-foreground" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs gap-2 cursor-pointer py-2 text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => onDelete(mk.id)}>
                  <Trash2 size={13} /> Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-0">
          <thead>
            <tr className="bg-muted/20">
              <th className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-2.5 text-left text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest border-b border-r border-border w-24 min-w-24">
                KOMPONEN
              </th>
              {sessions.map((s, i) => {
                const status = getSessionStatus(s, semester.tanggalMulai)
                return (
                  <th key={s.id} className={cn(
                    "px-2.5 py-2.5 text-center font-medium border-b border-border min-w-[82px]",
                    status === "done" ? "bg-emerald-500/8" :
                    status === "active" ? "bg-primary/6" :
                    status === "needs-input" ? "bg-amber-500/8" : "bg-muted/10"
                  )}>
                    <div className="text-[10px] font-bold text-foreground flex items-center justify-center gap-1">
                      {colLabel[0]}{i + 1}
                      {status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                      {status === "needs-input" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                    </div>
                    <div className="text-[8px] text-muted-foreground/60 font-normal mt-0.5">
                      {getSessionDateRange(semester.tanggalMulai, i + 1)}
                    </div>
                  </th>
                )
              })}
              <th className="px-3 py-2.5 text-center text-[9px] font-bold text-primary/60 uppercase tracking-widest min-w-[60px] bg-primary/5 border-b border-border">
                AVG
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Kehadiran */}
            <tr className="hover:bg-muted/5 transition-colors">
              <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-2 font-semibold text-muted-foreground text-[9px] uppercase tracking-widest border-r border-border/60">
                Hadir
              </td>
              {sessions.map((s) => {
                const status = getSessionStatus(s, semester.tanggalMulai)
                return (
                  <td key={s.id} className={cn("px-2.5 py-2 text-center", status === "done" && "bg-emerald-500/4")}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button"
                          onClick={() => onToggleKehadiran(s.id, s.kehadiran)}
                          className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center mx-auto transition-all duration-200 active:scale-90",
                            s.kehadiran
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-muted/50 text-muted-foreground/30 hover:bg-muted hover:text-muted-foreground border border-transparent"
                          )}>
                          {s.kehadiran ? <Check size={14} strokeWidth={3} /> : <X size={13} strokeWidth={2} />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom"><p className="text-[10px]">{s.kehadiran ? "Hapus" : "Catat"} kehadiran</p></TooltipContent>
                    </Tooltip>
                  </td>
                )
              })}
              <td className="px-3 py-2 text-center bg-primary/5 font-bold tabular-nums text-primary text-[11px]">
                {sessions.filter((s) => s.kehadiran).length}/{mk.jumlahSesi}
              </td>
            </tr>

            {/* Diskusi */}
            <tr className="hover:bg-muted/5 transition-colors">
              <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-1.5 font-semibold text-muted-foreground text-[9px] uppercase tracking-widest border-r border-border/60">
                Diskusi
              </td>
              {sessions.map((s) => {
                const status = getSessionStatus(s, semester.tanggalMulai)
                return (
                  <td key={s.id} className={cn("px-1.5 py-1.5 text-center", status === "done" && "bg-emerald-500/4")}>
                    <DiskusiCell session={s} isTuweb={isTuweb} onToggleNA={onToggleNA} onUpdateSession={onUpdateSession} />
                  </td>
                )
              })}
              <td className="px-3 py-1.5 text-center bg-primary/5 font-bold tabular-nums text-primary text-[11px]">
                {avgDiskusi !== null ? avgDiskusi.toFixed(1) : "—"}
              </td>
            </tr>

            {/* Tugas */}
            <tr className="hover:bg-muted/5 transition-colors">
              <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-1.5 font-semibold text-muted-foreground text-[9px] uppercase tracking-widest border-r border-border/60">
                Tugas
              </td>
              {sessions.map((s) => {
                const status = getSessionStatus(s, semester.tanggalMulai)
                return (
                  <td key={s.id} className={cn("px-1.5 py-1.5 text-center", status === "done" && "bg-emerald-500/4")}>
                    <TugasCell session={s} onToggleNA={onToggleNA} onUpdateSession={onUpdateSession} />
                  </td>
                )
              })}
              <td className="px-3 py-1.5 text-center bg-primary/5 font-bold tabular-nums text-primary text-[11px]">
                {avgTugas !== null ? avgTugas.toFixed(1) : "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/10 p-10 text-center">
      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
        <BookOpen size={18} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-medium mb-1">Belum ada mata kuliah</p>
      <p className="text-xs text-muted-foreground mb-4">Tambahkan mata kuliah untuk semester ini</p>
      <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={onAdd}>
        <PlusIcon size={13} /> Tambah Mata Kuliah
      </Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile Session Chips
// ─────────────────────────────────────────────────────────────────────────────
function MobileSessionChips({
  semester, activeSession, onSelectSession,
}: {
  semester: SemesterData
  activeSession: number
  onSelectSession: (n: number) => void
}) {
  const maxSesi = Math.max(...semester.mataKuliah.map((mk) => mk.jumlahSesi), 8)
  const kehadiranPerSesi = Array.from({ length: maxSesi }, (_, i) => {
    const sesiNum = i + 1
    return semester.mataKuliah.some((mk) => mk.sessions.find((s) => s.sesiNumber === sesiNum && s.kehadiran))
  })

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex gap-1.5 pb-1">
        {Array.from({ length: maxSesi }, (_, i) => {
          const sesiNum = i + 1
          const isActive = sesiNum === activeSession
          const hasHadir = kehadiranPerSesi[i]
          return (
            <button key={sesiNum} type="button" onClick={() => onSelectSession(sesiNum)}
              className={cn(
                "shrink-0 rounded-2xl flex flex-col items-center justify-center w-12 h-12 border transition-all duration-200",
                isActive ? "bg-foreground text-background border-foreground shadow-sm"
                : hasHadir ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                : "bg-card text-muted-foreground border-border hover:border-foreground/30"
              )}>
              <span className="text-[8px] font-bold uppercase tracking-wider opacity-60">S</span>
              <span className="text-base font-black leading-none">{sesiNum}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Minggu Ini Banner
// ─────────────────────────────────────────────────────────────────────────────
function MingguIniBanner({ semester, activeSession }: { semester: SemesterData; activeSession: number }) {
  const start = new Date(semester.tanggalMulai)
  const sStart = new Date(start)
  sStart.setDate(start.getDate() + (activeSession - 1) * 7)
  const sEnd = new Date(sStart)
  sEnd.setDate(sStart.getDate() + 6)

  const dateLabel = `${sStart.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}–${sEnd.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`

  const sessions = semester.mataKuliah.flatMap((mk) => mk.sessions.filter((s) => s.sesiNumber === activeSession))
  const pendingKehadiran = sessions.filter((s) => !s.kehadiran).length
  const pendingTugas = sessions.filter((s) => s.hasTugas && s.tugas === null && !s.tugasNA).length
  const pendingDiskusi = sessions.filter((s) => !s.hasTugas && !s.diskusiNA && s.diskusi === null).length
  const totalPending = pendingKehadiran + pendingTugas + pendingDiskusi

  if (totalPending === 0) {
    return (
      <div className="rounded-2xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3 flex items-center gap-3">
        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
        <div>
          <p className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400">Sesi {activeSession} lengkap</p>
          <p className="text-[11px] text-emerald-600/60">{dateLabel}</p>
        </div>
      </div>
    )
  }

  const parts: string[] = []
  if (pendingKehadiran > 0) parts.push(`${pendingKehadiran} kehadiran`)
  if (pendingTugas > 0) parts.push(`${pendingTugas} tugas`)
  if (pendingDiskusi > 0) parts.push(`${pendingDiskusi} diskusi`)

  return (
    <div className="rounded-2xl bg-muted/40 border border-border px-4 py-3">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
        Sesi {activeSession} · {dateLabel}
      </p>
      <p className="text-[15px] font-bold text-foreground">{totalPending} perlu diisi</p>
      <p className="text-[11px] text-muted-foreground">{parts.join(" · ")}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile Mata Kuliah Card
// ─────────────────────────────────────────────────────────────────────────────
function MobileMataKuliahCard({
  mk, semester, activeSession,
  onToggleKehadiran, onToggleNA, onUpdateSession, onEdit, onDelete, computeTotal,
}: {
  mk: MataKuliahData
  semester: SemesterData
  activeSession: number
  onToggleKehadiran: (id: string, current: boolean) => void
  onToggleNA: (id: string, field: "diskusi" | "tugas", currentNA: boolean) => void
  onUpdateSession: (id: string, field: "diskusi" | "tugas", value: string) => void
  onEdit: (mk: MataKuliahData) => void
  onDelete: (id: string) => void
  computeTotal: (mk: MataKuliahData) => number
}) {
  const sessions = mk.sessions || []
  const total = computeTotal(mk)
  const grade = getLetterGradeFromBoundaries(total, { A: 80, B: 70, C: 56, D: 45 })
  const gradeColorClass = getGradeColor(grade)
  const session = sessions.find((s) => s.sesiNumber === activeSession)
  const isTuweb = mk.jenis === "tuweb"

  const sessionEndDate = (() => {
    const s = new Date(semester.tanggalMulai)
    s.setDate(s.getDate() + (activeSession - 1) * 7 + 6)
    return s.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
  })()

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">{mk.kode}</span>
              <span className="text-[9px] text-muted-foreground/40 uppercase">{mk.jenis}</span>
            </div>
            <h3 className="text-[14px] font-semibold text-foreground leading-snug">{mk.nama}</h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            <span className={cn("text-xs font-black px-2 py-0.5 rounded-lg", gradeColorClass)}>
              {grade} {total.toFixed(1)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Opsi mata kuliah" className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                  <MoreHorizontal size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem className="text-xs gap-2 cursor-pointer py-2" onClick={() => onEdit(mk)}>
                  <Edit size={13} /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs gap-2 cursor-pointer py-2 text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => onDelete(mk.id)}>
                  <Trash2 size={13} /> Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-1 mt-3 flex-wrap">
          {Array.from({ length: mk.jumlahSesi }, (_, i) => {
            const sesiNum = i + 1
            const s = sessions.find((s) => s.sesiNumber === sesiNum)
            const isActive = sesiNum === activeSession
            const status = s ? getSessionStatus(s, semester.tanggalMulai) : "future"
            return (
              <div key={sesiNum} className={cn(
                "rounded-full transition-all duration-200",
                isActive ? "h-2.5 w-2.5 ring-2 ring-offset-1 ring-offset-card" : "h-2 w-2",
                s?.kehadiran ? isActive ? "bg-emerald-500 ring-emerald-500" : "bg-emerald-500"
                : status === "done" ? isActive ? "bg-muted-foreground/30 ring-muted-foreground/30" : "bg-muted-foreground/20"
                : status === "needs-input" ? isActive ? "bg-amber-400 ring-amber-400" : "bg-amber-400/50"
                : status === "active" ? isActive ? "bg-primary/50 ring-primary/50" : "bg-primary/25"
                : isActive ? "bg-foreground/15 ring-foreground/15" : "bg-muted-foreground/10"
              )} />
            )
          })}
        </div>
      </div>

      {/* Session detail */}
      {session ? (
        <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">Sesi {activeSession}</span>
            <span className="text-[10px] text-muted-foreground">sampai {sessionEndDate}</span>
          </div>

          <div className="flex gap-2">
            {/* Kehadiran */}
            <div className={cn(
              "flex-1 rounded-xl px-3 py-2.5 border flex items-center justify-between transition-colors",
              session.kehadiran ? "bg-emerald-500/8 border-emerald-500/25" : "bg-background border-border"
            )}>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Hadir</span>
              <Switch checked={session.kehadiran} onCheckedChange={() => onToggleKehadiran(session.id, session.kehadiran)}
                className="data-[state=checked]:bg-emerald-500 scale-90" />
            </div>

            {/* Diskusi / Tugas — show based on session type */}
            {!session.hasTugas && isTuweb && session.diskusiNA ? (
              // Tuweb session with no diskusi configured
              <div className="flex-1 rounded-xl px-3 py-2.5 border border-dashed border-border/60 bg-muted/10 flex items-center justify-center">
                <span className="text-[11px] text-muted-foreground/40">—</span>
              </div>
            ) : (() => {
              const field = session.hasTugas ? "tugas" : "diskusi"
              const isNA = session.hasTugas ? session.tugasNA : session.diskusiNA
              const currentVal = session.hasTugas ? session.tugas : session.diskusi
              return (
                <div className="flex-1 rounded-xl px-3 py-2 border border-border bg-background">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                      {session.hasTugas ? "Tugas" : "Diskusi"}
                    </span>
                    <button type="button" onClick={() => onToggleNA(session.id, field, isNA)}
                      className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded transition-colors",
                        isNA ? "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                        : "text-muted-foreground/40 hover:text-muted-foreground/70 hover:bg-muted/50")}>
                      {isNA ? "N/A ×" : "N/A"}
                    </button>
                  </div>
                  {isNA ? (
                    <p className="text-[11px] text-muted-foreground/30 text-center py-0.5">tidak relevan</p>
                  ) : (
                    <Input type="text" inputMode="decimal" value={currentVal ?? ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "")
                        const parts = val.split(".")
                        onUpdateSession(session.id, field, parts[0] + (parts.length > 1 ? "." + parts[1].slice(0, 2) : ""))
                      }}
                      className="h-7 w-full text-sm font-bold text-center min-h-0 px-0 border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-muted-foreground/25 shadow-none"
                      placeholder="0–100" />
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      ) : (
        <div className="border-t border-border/60 bg-muted/10 px-4 py-3 text-center">
          <span className="text-[11px] text-muted-foreground">Sesi {activeSession} belum tersedia</span>
        </div>
      )}
    </div>
  )
}
