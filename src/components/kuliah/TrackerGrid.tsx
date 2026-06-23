"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  AlertTriangle,
  ExternalLink,
  Video,
} from "lucide-react"
import { toast } from "sonner"
import { useConfirmStore } from "@/lib/confirm-store"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  parseSesiTugasList,
} from "@/lib/kuliah-types"
import { cn } from "@/lib/utils"
import { useKuliahLayout } from "@/app/(protected)/kuliah/layout"
import { useLanguage } from "@/lib/i18n/context"
import type { Translations } from "@/lib/i18n/en"

// ─────────────────────────────────────────────────────────────────────────────
function getJenisConfig(t: Translations): Record<string, { label: string; colLabel: string; badgeClass: string }> {
  return {
    reguler: { label: t.kuliah.regularLabel,  colLabel: t.kuliah.sessionColumnLabel,  badgeClass: "border-primary/30 text-primary bg-primary/5" },
    praktik: { label: t.kuliah.practicalLabel, colLabel: t.kuliah.sessionColumnLabel, badgeClass: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5" },
    tuweb:   { label: "Tuweb",                 colLabel: t.kuliah.activityColumnLabel, badgeClass: "border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5" },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
function SemesterStatusChips({ semester }: { semester: SemesterData }) {
  const { t } = useLanguage()
  const stats = useMemo(() => {
    const now = new Date()
    let totalPast = 0, attended = 0
    const pending: { mkNama: string; sesiNum: number; missing: string }[] = []

    semester.mataKuliah.forEach((mk) => {
      mk.sessions.forEach((s) => {
        const status = getSessionStatus(s, semester.tanggalMulai, now)
        if (status === "future" || status === "active") return
        totalPast++
        if (s.kehadiran) attended++
        if (status === "needs-input") {
          const parts: string[] = []
          if (!(s.hasTugas || s.diskusiNA || s.diskusi !== null)) parts.push(t.kuliah.discussionLabel)
          if (!(!s.hasTugas || s.tugasNA || s.tugas !== null)) parts.push(t.kuliah.taskLabel)
          pending.push({ mkNama: mk.nama, sesiNum: s.sesiNumber, missing: parts.join(" & ") })
        }
      })
    })

    return {
      totalPast,
      attended,
      kehadiranPct: totalPast > 0 ? Math.round((attended / totalPast) * 100) : null,
      pending,
    }
  }, [semester, t])

  if (semester.mataKuliah.length === 0) return null

  const { kehadiranPct, pending, totalPast } = stats
  const hasPending = pending.length > 0

  return (
    <>
      {kehadiranPct !== null && (
        <span className={cn(
          "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full",
          kehadiranPct >= 75
            ? "bg-success/10 text-success"
            : "bg-destructive/10 text-destructive",
        )}>
          {kehadiranPct >= 75 ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
          {kehadiranPct}% {t.kuliah.presentLabel}
        </span>
      )}

      {hasPending ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              <AlertTriangle size={10} />
              {pending.length} {t.kuliah.sessionsNeedData}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={8} className="w-72 p-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2.5">
              <AlertTriangle size={12} className="text-amber-500" />
              {t.kuliah.sessionsIncomplete}
            </p>
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {pending.map((item, i) => (
                <div key={i} className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="font-medium text-foreground">{item.mkNama}</span>
                  <span className="text-muted-foreground">· {t.kuliah.sessionColumnLabel} {item.sesiNum}</span>
                  <span className="text-amber-500">· {item.missing}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : totalPast > 0 ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
          <CheckCircle2 size={10} />
          {t.kuliah.allComplete}
        </span>
      ) : null}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export function TrackerGrid() {
  const { openConfirm } = useConfirmStore()
  const { t, dateLocale } = useLanguage()
  const [semesters, setSemesters] = useState<SemesterData[]>([])
  const [activeSemesterId, setActiveSemesterId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [addMkOpen, setAddMkOpen] = useState(false)
  const [editMk, setEditMk] = useState<MataKuliahData | null>(null)
  const [activeMobileSession, setActiveMobileSession] = useState(1)
  const [mobileView, setMobileView] = useState<"minggu-ini" | "semua-sesi">("minggu-ini")
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
      if (!res.ok) throw new Error(t.kuliah.createSemesterError)
      const created: SemesterData = await res.json()
      setSemesters((prev) => [created, ...prev])
      setActiveSemesterId(created.id)
      setNewSemester({ show: false, nama: "", tanggalMulai: "", totalSKS: "" })
      return created
    })
    toast.promise(promise, {
      loading: t.kuliah.createSemesterLoading,
      success: (d) => `"${d.nama}" ${t.kuliah.courseAddedMsg}`,
      error: t.kuliah.createSemesterError,
    })
  }

  const handleDeleteSemester = async (id: string) => {
    const sem = semesters.find((s) => s.id === id)
    if (!sem) return
    const ok = await openConfirm({
      title: `${t.kuliah.deleteSemesterLabel} "${sem.nama}"?`,
      description: t.kuliah.deleteSemesterCourseNote,
      confirmLabel: t.common.delete,
      variant: "destructive",
    })
    if (!ok) return
    const promise = fetch(`/api/kuliah/semester/${id}`, { method: "DELETE" }).then(async (res) => {
      if (!res.ok) throw new Error(t.kuliah.deleteSemesterError)
      setSemesters((prev) => prev.filter((s) => s.id !== id))
      if (activeSemesterId === id)
        setActiveSemesterId((semesters.find((s) => s.id !== id)?.id) || "")
    })
    toast.promise(promise, {
      loading: t.kuliah.deleteSemesterLoading,
      success: t.kuliah.deleteSemesterSuccess,
      error: t.kuliah.deleteSemesterError,
    })
  }

  // ── Matkul CRUD ───────────────────────────────────────────────────────────
  const handleAddMatkul = useCallback((mk: MataKuliahData) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === mk.semesterId ? { ...sem, mataKuliah: [...sem.mataKuliah, mk] } : sem
      )
    )
    toast.success(`"${mk.nama}" ${t.kuliah.courseAddedMsg}`)
  }, [t])

  const handleEditMatkul = useCallback((mk: MataKuliahData) => {
    setSemesters((prev) =>
      prev.map((sem) =>
        sem.id === mk.semesterId
          ? { ...sem, mataKuliah: sem.mataKuliah.map((m) => (m.id === mk.id ? mk : m)) }
          : sem
      )
    )
    toast.success(`"${mk.nama}" ${t.kuliah.courseUpdatedMsg}`)
  }, [t])

  const handleDeleteMatkul = async (id: string) => {
    const ok = await openConfirm({ title: t.kuliah.deleteCourseConfirm, confirmLabel: t.common.delete, variant: "destructive" })
    if (!ok) return
    const promise = fetch(`/api/kuliah/matkul/${id}`, { method: "DELETE" }).then(async (res) => {
      if (!res.ok) throw new Error(t.kuliah.deleteCourseError)
      setSemesters((prev) =>
        prev.map((sem) => ({ ...sem, mataKuliah: sem.mataKuliah.filter((mk) => mk.id !== id) }))
      )
    })
    toast.promise(promise, {
      loading: t.kuliah.deleteCourseLoading,
      success: t.kuliah.deleteCourseSuccess,
      error: t.kuliah.deleteCourseError,
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
      toast.error(t.kuliah.updateAttendanceError)
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
      toast.error(t.kuliah.updateSessionError)
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
            toast.error(t.kuliah.saveSessionError)
          }
          debounceTimers.current.delete(key)
        }, 700)
      )
    },
    [updateSessionLocal]
  )

  const handleUpdateZoomUrl = useCallback(
    (sessionId: string, value: string) => {
      const url = value === "" ? null : value
      updateSessionLocal(sessionId, { zoomUrl: url })

      const key = `${sessionId}-zoom`
      const existing = debounceTimers.current.get(key)
      if (existing) clearTimeout(existing)

      debounceTimers.current.set(
        key,
        setTimeout(async () => {
          try {
            await fetch(`/api/kuliah/session/${sessionId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ zoomUrl: url }),
            })
          } catch {
            toast.error(t.kuliah.saveSessionError)
          }
          debounceTimers.current.delete(key)
        }, 700)
      )
    },
    [updateSessionLocal, t]
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
            <h2 className="text-lg font-bold tracking-tight">{t.kuliah.trackerTitle}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t.kuliah.trackerDesc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {semesters.length > 0 ? (
              <Select value={activeSemesterId} onValueChange={setActiveSemesterId}>
                <SelectTrigger className="w-52 h-9 text-sm font-medium">
                  <SelectValue placeholder={t.kuliah.selectSemesterPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-sm">{s.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-muted-foreground">{t.kuliah.noSemesters}</span>
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
                    <Trash2 size={14} /> {t.kuliah.deleteSemesterLabel}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5"
                onClick={() => setNewSemester((p) => ({ ...p, show: !p.show }))}>
                <PlusIcon size={13} /> {t.kuliah.newSemesterLabel}
              </Button>
              {activeSemester && (
                <Button size="sm" className="h-9 text-xs gap-1.5" onClick={() => setAddMkOpen(true)}>
                  <PlusIcon size={13} /> {t.kuliah.addCourse}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── New Semester Form ──────────────────────────────────────── */}
        {newSemester.show && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 animate-slide-up">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.kuliah.newSemesterLabel}</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
              <Input
                placeholder={t.kuliah.semesterNamePlaceholder}
                value={newSemester.nama}
                onChange={(e) => setNewSemester((p) => ({ ...p, nama: e.target.value }))}
                className="flex-1 min-w-[200px]"
              />
              <div className="flex items-center gap-1.5">
                <CalendarDays size={13} className="text-muted-foreground shrink-0" />
                <Input
                  type="date"
                  value={newSemester.tanggalMulai}
                  onChange={(e) => setNewSemester((p) => ({ ...p, tanggalMulai: e.target.value }))}
                  className="w-40"
                />
              </div>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder={t.kuliah.targetCreditsPlaceholder}
                value={newSemester.totalSKS}
                onChange={(e) => setNewSemester((p) => ({ ...p, totalSKS: e.target.value.replace(/[^0-9]/g, "") }))}
                className="w-28"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCreateSemester}
                  disabled={!newSemester.nama.trim() || !newSemester.tanggalMulai}
                >
                  {t.common.save}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setNewSemester({ show: false, nama: "", tanggalMulai: "", totalSKS: "" })}
                >
                  {t.common.cancel}
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
              {new Date(activeSemester.tanggalMulai).toLocaleDateString(dateLocale, { day: "2-digit", month: "long", year: "numeric" })}
            </p>
            <SKSSummary semester={activeSemester} />
            <SemesterStatusChips semester={activeSemester} />
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
                    {v === "minggu-ini" ? t.kuliah.thisWeek : t.kuliah.allSessionsView}
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
                const cfg = getJenisConfig(t)[jenis]
                return (
                  <div key={jenis} className="space-y-2.5">
                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold", cfg.badgeClass)}>
                      {cfg.label}
                    </Badge>
                    {mkList.map((mk) => (
                      <MobileMataKuliahCard key={mk.id} mk={mk} semester={activeSemester}
                        activeSession={activeMobileSession}
                        onToggleKehadiran={handleToggleKehadiran}
                        onUpdateSession={handleUpdateSession}
                        onUpdateZoomUrl={handleUpdateZoomUrl}
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
                const cfg = getJenisConfig(t)[jenis]
                return (
                  <div key={jenis} className="space-y-3">
                    <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-bold", cfg.badgeClass)}>
                      {cfg.label}
                    </Badge>
                    {mkList.map((mk) => (
                      <MataKuliahTable key={mk.id} mk={mk} semester={activeSemester}
                        colLabel={cfg.colLabel}
                        onToggleKehadiran={handleToggleKehadiran}
                        onUpdateSession={handleUpdateSession}
                        onUpdateZoomUrl={handleUpdateZoomUrl}
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
            <p className="text-sm font-medium mb-1">{t.kuliah.noSemesters}</p>
            <p className="text-xs text-muted-foreground mb-4">{t.kuliah.noSemestersDesc}</p>
            <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5"
              onClick={() => setNewSemester((p) => ({ ...p, show: true }))}>
              <PlusIcon size={13} /> {t.kuliah.createSemesterBtn}
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
  const { t } = useLanguage()
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
      {enrolled}/{target} SKS{isOver && t.kuliah.overCreditsLabel}{isExact && " ✓"}
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
// DiskusiCell
// ─────────────────────────────────────────────────────────────────────────────
function DiskusiCell({
  session,
  isEffectiveTugas,
  onUpdateSession,
}: {
  session: SesiKuliahData
  isEffectiveTugas: boolean
  onUpdateSession: (id: string, field: "diskusi" | "tugas", value: string) => void
}) {
  if (isEffectiveTugas) {
    return <div className="h-8 flex items-center justify-center"><span className="text-muted-foreground/25 text-xs">—</span></div>
  }
  return (
    <div className="flex justify-center">
      <SessionNumberInput value={session.diskusi}
        onChange={(v) => onUpdateSession(session.id, "diskusi", v)} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TugasCell
// ─────────────────────────────────────────────────────────────────────────────
function TugasCell({
  session,
  isEffectiveTugas,
  onUpdateSession,
}: {
  session: SesiKuliahData
  isEffectiveTugas: boolean
  onUpdateSession: (id: string, field: "diskusi" | "tugas", value: string) => void
}) {
  if (!isEffectiveTugas) {
    return <div className="h-8 flex items-center justify-center"><span className="text-muted-foreground/25 text-xs">—</span></div>
  }
  return (
    <div className="flex justify-center">
      <SessionNumberInput value={session.tugas}
        onChange={(v) => onUpdateSession(session.id, "tugas", v)} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Derive effective tugas session numbers:
// use hasTugas if any session has it annotated, else fall back to sesiTugasList
function getEffectiveTugaNums(mk: MataKuliahData): Set<number> {
  const annotated = mk.sessions.filter((s) => s.hasTugas)
  if (mk.jenis === "tuweb" || annotated.length > 0)
    return new Set(annotated.map((s) => s.sesiNumber))
  return new Set(parseSesiTugasList(mk.sesiTugasList || "3,5,7"))
}

// ─────────────────────────────────────────────────────────────────────────────
// ZoomCell — Tuweb zoom URL input per activity
// ─────────────────────────────────────────────────────────────────────────────
function ZoomCell({
  session,
  onUpdateZoomUrl,
  placeholder,
}: {
  session: SesiKuliahData
  onUpdateZoomUrl: (id: string, value: string) => void
  placeholder: string
}) {
  return (
    <div className="flex items-center gap-1">
      <Input
        type="text"
        value={session.zoomUrl ?? ""}
        onChange={(e) => onUpdateZoomUrl(session.id, e.target.value)}
        className="h-7 w-full text-[10px] min-h-0 px-1.5 bg-background border-muted-foreground/20 placeholder:text-muted-foreground/25"
        placeholder={placeholder}
      />
      {session.zoomUrl && (
        <a
          href={session.zoomUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Zoom link"
          className="h-7 w-7 rounded flex items-center justify-center text-purple-500 hover:bg-purple-500/10 transition-colors shrink-0"
        >
          <ExternalLink size={11} />
        </a>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MataKuliahTable (Desktop)
// ─────────────────────────────────────────────────────────────────────────────
function MataKuliahTable({
  mk, semester, colLabel,
  onToggleKehadiran, onUpdateSession, onUpdateZoomUrl, onDelete, onEdit, computeTotal,
}: {
  mk: MataKuliahData
  semester: SemesterData
  colLabel: string
  onToggleKehadiran: (id: string, current: boolean) => void
  onUpdateSession: (id: string, field: "diskusi" | "tugas", value: string) => void
  onUpdateZoomUrl: (id: string, value: string) => void
  onDelete: (id: string) => void
  onEdit: (mk: MataKuliahData) => void
  computeTotal: (mk: MataKuliahData) => number
}) {
  const { t } = useLanguage()
  const kuliahLayout = useKuliahLayout()
  const sessions = mk.sessions || []
  const total = computeTotal(mk)
  const completedCount = sessions.filter((s) => getSessionStatus(s, semester.tanggalMulai) === "done").length
  const isTuweb = mk.jenis === "tuweb"
  const effectiveTugaNums = getEffectiveTugaNums(mk)

  // Averages for total column
  const diskusiVals = sessions.filter((s) => s.diskusi !== null && !effectiveTugaNums.has(s.sesiNumber) && !s.diskusiNA).map((s) => s.diskusi!)
  const tugasVals = sessions.filter((s) => s.tugas !== null && effectiveTugaNums.has(s.sesiNumber) && !s.tugasNA).map((s) => s.tugas!)
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
                  onClick={() => { kuliahLayout.setIsChatOpen(true); toast.success(t.kuliah.addedToAIContextMsg) }}>
                  <MessageSquarePlus size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p className="text-[10px]">{t.kuliah.addToAIContextLabel}</p></TooltipContent>
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
                  <Trash2 size={13} /> {t.common.delete}
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
                {t.kuliah.componentColumnLabel}
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
            {/* Kehadiran — hidden for Tuweb */}
            {!isTuweb && (
              <tr className="hover:bg-muted/5 transition-colors">
                <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-2 font-semibold text-muted-foreground text-[9px] uppercase tracking-widest border-r border-border/60">
                  {t.kuliah.attendRowLabel}
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
                        <TooltipContent side="bottom"><p className="text-[10px]">{s.kehadiran ? t.kuliah.removeAttendanceLabel : t.kuliah.recordAttendanceLabel}</p></TooltipContent>
                      </Tooltip>
                    </td>
                  )
                })}
                <td className="px-3 py-2 text-center bg-primary/5 font-bold tabular-nums text-primary text-[11px]">
                  {sessions.filter((s) => s.kehadiran).length}/{mk.jumlahSesi}
                </td>
              </tr>
            )}

            {/* Diskusi — hidden for Tuweb */}
            {!isTuweb && (
              <tr className="hover:bg-muted/5 transition-colors">
                <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-1.5 font-semibold text-muted-foreground text-[9px] uppercase tracking-widest border-r border-border/60">
                  {t.kuliah.discussRowLabel}
                </td>
                {sessions.map((s) => {
                  const status = getSessionStatus(s, semester.tanggalMulai)
                  return (
                    <td key={s.id} className={cn("px-1.5 py-1.5 text-center", status === "done" && "bg-emerald-500/4")}>
                      <DiskusiCell session={s} isEffectiveTugas={effectiveTugaNums.has(s.sesiNumber)} onUpdateSession={onUpdateSession} />

                    </td>
                  )
                })}
                <td className="px-3 py-1.5 text-center bg-primary/5 font-bold tabular-nums text-primary text-[11px]">
                  {avgDiskusi !== null ? avgDiskusi.toFixed(1) : "—"}
                </td>
              </tr>
            )}

            {/* Tugas */}
            <tr className="hover:bg-muted/5 transition-colors">
              <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-1.5 font-semibold text-muted-foreground text-[9px] uppercase tracking-widest border-r border-border/60">
                {t.kuliah.taskRowLabel}
              </td>
              {sessions.map((s) => {
                const status = getSessionStatus(s, semester.tanggalMulai)
                return (
                  <td key={s.id} className={cn("px-1.5 py-1.5 text-center", status === "done" && "bg-emerald-500/4")}>
                    <TugasCell session={s} isEffectiveTugas={effectiveTugaNums.has(s.sesiNumber)} onUpdateSession={onUpdateSession} />
                  </td>
                )
              })}
              <td className="px-3 py-1.5 text-center bg-primary/5 font-bold tabular-nums text-primary text-[11px]">
                {avgTugas !== null ? avgTugas.toFixed(1) : "—"}
              </td>
            </tr>

            {/* Zoom — only for Tuweb, only cells with hasZoom=true show input */}
            {isTuweb && sessions.some((s) => s.hasZoom) && (
              <tr className="hover:bg-muted/5 transition-colors">
                <td className="sticky left-0 z-10 bg-card/95 backdrop-blur-sm px-4 py-1.5 font-semibold text-muted-foreground text-[9px] uppercase tracking-widest border-r border-border/60">
                  <span className="flex items-center gap-1">
                    <Video size={9} className="text-purple-500" />
                    {t.kuliah.zoomRowLabel}
                  </span>
                </td>
                {sessions.map((s) => {
                  const status = getSessionStatus(s, semester.tanggalMulai)
                  return (
                    <td key={s.id} className={cn("px-1.5 py-1.5", status === "done" && "bg-emerald-500/4")}>
                      {s.hasZoom ? (
                        <ZoomCell session={s} onUpdateZoomUrl={onUpdateZoomUrl} placeholder={t.kuliah.zoomUrlPlaceholder} />
                      ) : (
                        <div className="h-7 flex items-center justify-center">
                          <span className="text-muted-foreground/25 text-xs">—</span>
                        </div>
                      )}
                    </td>
                  )
                })}
                <td className="px-3 py-1.5 bg-primary/5" />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/10 p-10 text-center">
      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
        <BookOpen size={18} className="text-muted-foreground" />
      </div>
      <p className="text-sm font-medium mb-1">{t.kuliah.noCoursesEmpty}</p>
      <p className="text-xs text-muted-foreground mb-4">{t.kuliah.noCoursesEmptyDesc}</p>
      <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" onClick={onAdd}>
        <PlusIcon size={13} /> {t.kuliah.addCourse}
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
  const { t, dateLocale } = useLanguage()
  const start = new Date(semester.tanggalMulai)
  const sStart = new Date(start)
  sStart.setDate(start.getDate() + (activeSession - 1) * 7)
  const sEnd = new Date(sStart)
  sEnd.setDate(sStart.getDate() + 6)

  const dateLabel = `${sStart.toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}–${sEnd.toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}`

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
          <p className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400">{t.kuliah.sessionCompleteMsg.replace("{n}", String(activeSession))}</p>
          <p className="text-[11px] text-emerald-600/60">{dateLabel}</p>
        </div>
      </div>
    )
  }

  const parts: string[] = []
  if (pendingKehadiran > 0) parts.push(`${pendingKehadiran} ${t.kuliah.pendingAttendanceLabel}`)
  if (pendingTugas > 0) parts.push(`${pendingTugas} ${t.kuliah.pendingTaskLabel}`)
  if (pendingDiskusi > 0) parts.push(`${pendingDiskusi} ${t.kuliah.pendingDiscussionLabel}`)

  return (
    <div className="rounded-2xl bg-muted/40 border border-border px-4 py-3">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
        {t.kuliah.sessionColumnLabel} {activeSession} · {dateLabel}
      </p>
      <p className="text-[15px] font-bold text-foreground">{totalPending} {t.kuliah.sessionPendingMsg}</p>
      <p className="text-[11px] text-muted-foreground">{parts.join(" · ")}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile Mata Kuliah Card
// ─────────────────────────────────────────────────────────────────────────────
function MobileMataKuliahCard({
  mk, semester, activeSession,
  onToggleKehadiran, onUpdateSession, onUpdateZoomUrl, onEdit, onDelete, computeTotal,
}: {
  mk: MataKuliahData
  semester: SemesterData
  activeSession: number
  onToggleKehadiran: (id: string, current: boolean) => void
  onUpdateSession: (id: string, field: "diskusi" | "tugas", value: string) => void
  onUpdateZoomUrl: (id: string, value: string) => void
  onEdit: (mk: MataKuliahData) => void
  onDelete: (id: string) => void
  computeTotal: (mk: MataKuliahData) => number
}) {
  const { t, dateLocale } = useLanguage()
  const sessions = mk.sessions || []
  const total = computeTotal(mk)
  const grade = getLetterGradeFromBoundaries(total, { A: 80, B: 70, C: 56, D: 45 })
  const gradeColorClass = getGradeColor(grade)
  const session = sessions.find((s) => s.sesiNumber === activeSession)
  const isTuweb = mk.jenis === "tuweb"
  const effectiveTugaNums = getEffectiveTugaNums(mk)
  const isSessionTugas = session ? effectiveTugaNums.has(session.sesiNumber) : false

  const sessionEndDate = (() => {
    const s = new Date(semester.tanggalMulai)
    s.setDate(s.getDate() + (activeSession - 1) * 7 + 6)
    return s.toLocaleDateString(dateLocale, { day: "numeric", month: "short" })
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
                  <Trash2 size={13} /> {t.common.delete}
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
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">{t.kuliah.sessionColumnLabel} {activeSession}</span>
            <span className="text-[10px] text-muted-foreground">{t.kuliah.sessionUntilLabel} {sessionEndDate}</span>
          </div>

          <div className="flex gap-2">
            {/* Kehadiran — hidden for Tuweb */}
            {!isTuweb && (
              <div className={cn(
                "flex-1 rounded-xl px-3 py-2.5 border flex items-center justify-between transition-colors",
                session.kehadiran ? "bg-emerald-500/8 border-emerald-500/25" : "bg-background border-border"
              )}>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase">{t.kuliah.attendRowLabel}</span>
                <Switch checked={session.kehadiran} onCheckedChange={() => onToggleKehadiran(session.id, session.kehadiran)}
                  className="data-[state=checked]:bg-emerald-500 scale-90" />
              </div>
            )}

            {/* Diskusi/Tugas — for Tuweb only show tugas; for others show based on effective tugas */}
            {(isTuweb ? isSessionTugas : true) && (
              <div className="flex-1 rounded-xl px-3 py-2 border border-border bg-background">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase block mb-0.5">
                  {isSessionTugas ? t.kuliah.taskLabel : t.kuliah.discussionLabel}
                </span>
                <Input type="text" inputMode="decimal"
                  value={(isSessionTugas ? session.tugas : session.diskusi) ?? ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "")
                    const parts = val.split(".")
                    onUpdateSession(session.id, isSessionTugas ? "tugas" : "diskusi", parts[0] + (parts.length > 1 ? "." + parts[1].slice(0, 2) : ""))
                  }}
                  className="h-7 w-full text-sm font-bold text-center min-h-0 px-0 border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-muted-foreground/25 shadow-none"
                  placeholder="0–100" />
              </div>
            )}
          </div>

          {/* Zoom URL — only for Tuweb sessions with hasZoom=true */}
          {isTuweb && session.hasZoom && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2">
              <Video size={12} className="text-purple-500 shrink-0" />
              <Input
                type="text"
                value={session.zoomUrl ?? ""}
                onChange={(e) => onUpdateZoomUrl(session.id, e.target.value)}
                className="h-6 flex-1 text-[11px] min-h-0 px-1 border-0 bg-transparent p-0 focus-visible:ring-0 placeholder:text-muted-foreground/30 shadow-none"
                placeholder={t.kuliah.zoomUrlPlaceholder}
              />
              {session.zoomUrl && (
                <a
                  href={session.zoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Zoom link"
                  className="text-purple-500 hover:text-purple-600 transition-colors shrink-0"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-border/60 bg-muted/10 px-4 py-3 text-center">
          <span className="text-[11px] text-muted-foreground">{t.kuliah.sessionNotAvailableMsg.replace("{n}", String(activeSession))}</span>
        </div>
      )}
    </div>
  )
}
