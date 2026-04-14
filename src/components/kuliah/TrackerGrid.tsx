/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useState } from "react"
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
} from "lucide-react"
import { AddMataKuliahDialog } from "./AddMataKuliahDialog"
import { EditMataKuliahDialog } from "./EditMataKuliahDialog"
import {
  SemesterData,
  MataKuliahData,
  getSessionDateRange,
} from "@/lib/kuliah-types"
import { cn } from "@/lib/utils"

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
  })
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  // Fetch semesters
  const fetchSemesters = useCallback(async () => {
    try {
      const res = await fetch("/api/kuliah/semester")
      if (!res.ok) return
      const data = await res.json()
      setSemesters(data)
      if (data.length > 0 && !activeSemesterId) {
        setActiveSemesterId(data[0].id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeSemesterId])

  useEffect(() => {
    fetchSemesters()
  }, [fetchSemesters])

  const activeSemester = semesters.find((s) => s.id === activeSemesterId)

  // Create semester
  const handleCreateSemester = async () => {
    if (!newSemester.nama.trim() || !newSemester.tanggalMulai) return
    try {
      const res = await fetch("/api/kuliah/semester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: newSemester.nama,
          tanggalMulai: newSemester.tanggalMulai,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const created = await res.json()
      setActiveSemesterId(created.id)
      setNewSemester({ show: false, nama: "", tanggalMulai: "" })
      await fetchSemesters()
    } catch (e) {
      console.error(e)
    }
  }

  // Delete semester
  const handleDeleteSemester = async (id: string) => {
    if (!confirm("Hapus semester beserta semua mata kuliah di dalamnya?")) return
    try {
      await fetch(`/api/kuliah/semester/${id}`, { method: "DELETE" })
      if (activeSemesterId === id) {
        setActiveSemesterId(semesters.find((s) => s.id !== id)?.id || "")
      }
      await fetchSemesters()
    } catch (e) {
      console.error(e)
    }
  }

  // Delete matkul
  const handleDeleteMatkul = async (id: string) => {
    if (!confirm("Hapus mata kuliah ini?")) return
    try {
      await fetch(`/api/kuliah/matkul/${id}`, { method: "DELETE" })
      await fetchSemesters()
    } catch (e) {
      console.error(e)
    }
  }

  // Toggle kehadiran
  const handleToggleKehadiran = async (sessionId: string, current: boolean) => {
    setUpdating((p) => new Set(p).add(sessionId))
    try {
      await fetch(`/api/kuliah/session/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kehadiran: !current }),
      })
      await fetchSemesters()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating((p) => {
        const n = new Set(p)
        n.delete(sessionId)
        return n
      })
    }
  }

  // Update diskusi/tugas value
  const handleUpdateSession = async (
    sessionId: string,
    field: "diskusi" | "tugas",
    value: string
  ) => {
    const numVal = value === "" ? null : Number(value)
    setUpdating((p) => new Set(p).add(sessionId))
    try {
      await fetch(`/api/kuliah/session/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: numVal }),
      })
      await fetchSemesters()
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating((p) => {
        const n = new Set(p)
        n.delete(sessionId)
        return n
      })
    }
  }

  // Compute row total for a mata kuliah
  const computeTotal = (mk: MataKuliahData) => {
    const sessions = mk.sessions || []
    const kehadiranCount = sessions.filter((s) => s.kehadiran).length
    const diskusiVals = sessions
      .filter((s) => s.diskusi !== null)
      .map((s) => s.diskusi!)
    const tugasVals = sessions
      .filter((s) => s.tugas !== null && [3, 5, 7].includes(s.sesiNumber))
      .map((s) => s.tugas!)
    const avgDiskusi =
      diskusiVals.length > 0
        ? diskusiVals.reduce((a, b) => a + b, 0) / diskusiVals.length
        : 0
    const avgTugas =
      tugasVals.length > 0
        ? tugasVals.reduce((a, b) => a + b, 0) / tugasVals.length
        : 0
    // Simple total: kehadiran * 2.5 (max 20) + diskusi avg * 0.3 + tugas avg * 0.5
    const nilaiKehadiran = (kehadiranCount / 8) * 20
    const nilaiDiskusi = avgDiskusi * 0.3
    const nilaiTugas = avgTugas * 0.5
    return nilaiKehadiran + nilaiDiskusi + nilaiTugas
  }

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
            <Select
              value={activeSemesterId}
              onValueChange={setActiveSemesterId}
            >
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
            <p className="text-sm text-muted-foreground">
              Belum ada semester
            </p>
          )}

          {activeSemester && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 min-h-0 min-w-0 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Nama (contoh: Semester 1 2025/2026)"
              value={newSemester.nama}
              onChange={(e) =>
                setNewSemester((p) => ({ ...p, nama: e.target.value }))
              }
              className="h-9 text-sm flex-1"
            />
            <div className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-muted-foreground shrink-0" />
              <Input
                type="date"
                value={newSemester.tanggalMulai}
                onChange={(e) =>
                  setNewSemester((p) => ({
                    ...p,
                    tanggalMulai: e.target.value,
                  }))
                }
                className="h-9 text-sm w-40"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-9 text-xs min-h-0"
                onClick={handleCreateSemester}
                disabled={
                  !newSemester.nama.trim() || !newSemester.tanggalMulai
                }
              >
                Simpan
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs min-h-0"
                onClick={() =>
                  setNewSemester({
                    show: false,
                    nama: "",
                    tanggalMulai: "",
                  })
                }
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Semester Date Info */}
      {activeSemester && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <CalendarDays size={12} />
          Mulai:{" "}
          {new Date(activeSemester.tanggalMulai).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}

      {/* Tracker Tables */}
      {activeSemester &&
      activeSemester.mataKuliah &&
      activeSemester.mataKuliah.length > 0 ? (
        <div className="space-y-4">
          {/* Group by jenis */}
          {["reguler", "praktik"].map((jenis) => {
            const mkList = activeSemester.mataKuliah.filter(
              (mk) => mk.jenis === jenis
            )
            if (mkList.length === 0) return null
            return (
              <div key={jenis} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] uppercase tracking-wider font-bold min-h-0 min-w-0",
                      jenis === "reguler"
                        ? "border-primary/30 text-primary"
                        : "border-amber-500/30 text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {jenis === "reguler"
                      ? "Mata Kuliah Reguler"
                      : "Mata Kuliah Praktik (tanpa Tuweb)"}
                  </Badge>
                </div>

                {mkList.map((mk) => (
                  <MataKuliahTable
                    key={mk.id}
                    mk={mk}
                    semester={activeSemester}
                    updating={updating}
                    onToggleKehadiran={handleToggleKehadiran}
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
          onSuccess={fetchSemesters}
        />
      )}

      {/* Edit Matkul Dialog */}
      <EditMataKuliahDialog
        open={!!editMk}
        onOpenChange={(open) => { if (!open) setEditMk(null) }}
        mataKuliah={editMk}
        onSuccess={fetchSemesters}
      />
    </div>
  )
}

// ============================================================================
// Mata Kuliah Table Sub-Component
// ============================================================================
function MataKuliahTable({
  mk,
  semester,
  updating,
  onToggleKehadiran,
  onUpdateSession,
  onDelete,
  onEdit,
  computeTotal,
}: {
  mk: MataKuliahData
  semester: SemesterData
  updating: Set<string>
  onToggleKehadiran: (id: string, current: boolean) => void
  onUpdateSession: (id: string, field: "diskusi" | "tugas", value: string) => void
  onDelete: (id: string) => void
  onEdit: (mk: MataKuliahData) => void
  computeTotal: (mk: MataKuliahData) => number
}) {
  const sessions = mk.sessions || []
  const total = computeTotal(mk)

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={14} className="text-primary shrink-0" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {mk.kode}
          </span>
          <span className="text-sm font-semibold text-foreground truncate">
            {mk.nama}
          </span>
          <Badge
            variant="outline"
            className="text-[9px] min-h-0 min-w-0 border-border text-muted-foreground"
          >
            {mk.sks} SKS
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold tabular-nums text-primary">
            {total.toFixed(1)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-7 w-7 min-h-0 min-w-0 rounded flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
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
              {Array.from({ length: 8 }, (_, i) => (
                <th
                  key={i}
                  className="px-2 py-2 text-center font-medium text-muted-foreground min-w-[80px]"
                >
                  <div className="text-[11px] font-bold text-foreground">
                    Sesi {i + 1}
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
            {/* Kehadiran Row */}
            <tr className="border-b border-border/50 hover:bg-muted/10 transition-colors">
              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-muted-foreground">
                Kehadiran
              </td>
              {sessions.map((s) => (
                <td key={s.id} className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => onToggleKehadiran(s.id, s.kehadiran)}
                    disabled={updating.has(s.id)}
                    className={cn(
                      "h-7 w-7 min-h-0 min-w-0 rounded-md flex items-center justify-center mx-auto transition-all duration-200",
                      s.kehadiran
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                        : "bg-muted text-muted-foreground/40 hover:bg-muted/80 hover:text-muted-foreground"
                    )}
                  >
                    {updating.has(s.id) ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : s.kehadiran ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <X size={12} strokeWidth={2} />
                    )}
                  </button>
                </td>
              ))}
              <td className="px-3 py-1.5 text-center bg-muted/10">
                <span className="text-[11px] font-semibold tabular-nums text-foreground">
                  {sessions.filter((s) => s.kehadiran).length}/8
                </span>
              </td>
            </tr>

            {/* Diskusi Row */}
            <tr className="border-b border-border/50 hover:bg-muted/10 transition-colors">
              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium text-muted-foreground">
                Diskusi
              </td>
              {sessions.map((s) => (
                <td key={s.id} className="px-1 py-1.5 text-center">
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
                      ? (
                          vals.reduce((a, b) => a + b, 0) / vals.length
                        ).toFixed(1)
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
                const isTugasSesi = [3, 5, 7].includes(s.sesiNumber)
                return (
                  <td key={s.id} className="px-1 py-1.5 text-center">
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
                      <span className="text-muted-foreground/30 text-[10px]">
                        —
                      </span>
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
                          s.tugas !== null && [3, 5, 7].includes(s.sesiNumber)
                      )
                      .map((s) => s.tugas!)
                    return vals.length > 0
                      ? (
                          vals.reduce((a, b) => a + b, 0) / vals.length
                        ).toFixed(1)
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

// ============================================================================
// Empty State
// ============================================================================
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
