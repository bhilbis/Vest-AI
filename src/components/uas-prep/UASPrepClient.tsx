"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { QuizView, type Question } from "./QuizView"
import {
  Upload,
  FileText,
  Sparkles,
  BookOpen,
  ClipboardList,
  Save,
  Trash2,
  ChevronLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  BookMarked,
  RefreshCcw,
} from "lucide-react"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedPrep {
  id: string
  title: string
  summary: string
  createdAt: string
}

interface FullPrep extends SavedPrep {
  extractedText: string
  questions: Question[]
}

type Phase = "upload" | "extracting" | "preview" | "generating" | "result" | "viewing-saved"

// ─── Component ────────────────────────────────────────────────────────────────

export function UASPrepClient({ initialSaved }: { initialSaved: SavedPrep[] }) {
  const [phase, setPhase] = useState<Phase>("upload")
  const [savedList, setSavedList] = useState<SavedPrep[]>(initialSaved)

  // Upload step
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Extract step
  const [extractedText, setExtractedText] = useState("")
  const [charCount, setCharCount] = useState(0)

  // Generate step
  const [questionCount, setQuestionCount] = useState(30)
  const [summary, setSummary] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])

  // Viewing saved
  const [viewingPrep, setViewingPrep] = useState<FullPrep | null>(null)

  // Misc
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }, [])

  const handleExtract = async () => {
    if (!file || !title.trim()) {
      setError("Judul dan file wajib diisi.")
      return
    }
    setError("")
    setPhase("extracting")

    const form = new FormData()
    form.append("file", file)

    try {
      const res = await fetch("/api/uas-prep/extract", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal ekstrak teks")
      setExtractedText(data.extractedText)
      setCharCount(data.charCount)
      setPhase("preview")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
      setPhase("upload")
    }
  }

  const handleGenerate = async () => {
    setError("")
    setPhase("generating")

    try {
      const res = await fetch("/api/uas-prep/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, extractedText, questionCount }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal generate soal")
      setSummary(data.summary)
      setQuestions(data.questions)
      setIsSaved(false)
      setPhase("result")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
      setPhase("preview")
    }
  }

  const handleSave = async () => {
    if (isSaved) return
    setSaving(true)
    try {
      const res = await fetch("/api/uas-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, extractedText, summary, questions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan")
      setSavedList((prev) => [
        { id: data.id, title: data.title, summary: data.summary, createdAt: data.createdAt },
        ...prev,
      ])
      setIsSaved(true)
      toast.success("Berhasil disimpan!")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/uas-prep/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus")
      setSavedList((prev) => prev.filter((p) => p.id !== id))
      if (viewingPrep?.id === id) {
        setViewingPrep(null)
        setPhase("upload")
      }
      toast.success("Dihapus")
    } catch {
      toast.error("Gagal menghapus")
    }
  }

  const handleViewSaved = async (id: string) => {
    try {
      const res = await fetch(`/api/uas-prep/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setViewingPrep({ ...data, questions: data.questions as Question[] })
      setPhase("viewing-saved")
    } catch {
      toast.error("Gagal memuat data")
    }
  }

  const resetToUpload = () => {
    setPhase("upload")
    setFile(null)
    setTitle("")
    setExtractedText("")
    setSummary("")
    setQuestions([])
    setIsSaved(false)
    setError("")
    setViewingPrep(null)
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderUpload() {
    return (
      <div className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Judul Materi / Nama Mata Kuliah</label>
          <Input
            placeholder="Contoh: Kisi-kisi UAS EKMA4116 Manajemen"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 cursor-pointer transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Upload className="h-10 w-10 text-muted-foreground" />
          {file ? (
            <div className="text-center">
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium">Drag & drop atau klik untuk upload</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT — maks 10MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <Button onClick={handleExtract} disabled={!file || !title.trim()} className="w-full gap-2">
          <FileText size={16} />
          Ekstrak Teks
        </Button>
      </div>
    )
  }

  function renderPreview() {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">{charCount.toLocaleString()} karakter diekstrak</p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetToUpload} className="gap-1 text-muted-foreground">
            <ChevronLeft size={15} /> Ganti File
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-muted/30">
          <div className="px-4 py-2 border-b border-border flex items-center gap-2">
            <BookOpen size={14} className="text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Preview Teks Terekstrak</span>
          </div>
          <ScrollArea className="h-48">
            <pre className="p-4 text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground/80">
              {extractedText.slice(0, 2000)}{extractedText.length > 2000 ? "\n\n... (dipotong untuk preview)" : ""}
            </pre>
          </ScrollArea>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Jumlah Soal yang Digenerate</label>
            <div className="flex gap-2">
              {[20, 30, 40, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={cn(
                    "flex-1 rounded-lg border py-1.5 text-sm font-medium transition-colors",
                    questionCount === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <Button onClick={handleGenerate} className="w-full gap-2">
          <Sparkles size={16} />
          Generate Ringkasan & {questionCount} Soal
        </Button>
      </div>
    )
  }

  function renderLoading(message: string) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">{message}</p>
          <p className="text-xs text-muted-foreground">Ini mungkin memakan waktu 10-30 detik</p>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    )
  }

  function renderResult(t: string, s: string, q: Question[], et: string, saved: boolean) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{t}</h3>
            <p className="text-xs text-muted-foreground">{q.length} soal pilihan ganda</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {!saved && (
              <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} className="text-green-500" /> : <Save size={14} />}
                {saved ? "Tersimpan" : "Simpan"}
              </Button>
            )}
            {saved && (
              <Badge variant="secondary" className="gap-1 py-1.5">
                <CheckCircle2 size={12} className="text-green-500" /> Tersimpan
              </Badge>
            )}
            <Button size="sm" variant="ghost" onClick={resetToUpload} className="gap-1 text-muted-foreground">
              <RefreshCcw size={14} /> Baru
            </Button>
          </div>
        </div>

        <Tabs defaultValue="summary">
          <TabsList className="w-full">
            <TabsTrigger value="text" className="flex-1 gap-1.5 text-xs">
              <BookOpen size={13} /> Teks Asli
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex-1 gap-1.5 text-xs">
              <ClipboardList size={13} /> Ringkasan
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex-1 gap-1.5 text-xs">
              <Sparkles size={13} /> Latihan ({q.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4">
            <ScrollArea className="h-[60vh] rounded-xl border border-border">
              <pre className="p-4 text-xs leading-relaxed whitespace-pre-wrap font-sans text-foreground/80">
                {et}
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <div className="rounded-xl border border-border p-5">
              <ScrollArea className="h-[60vh]">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{s}</p>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="quiz" className="mt-4">
            <QuizView questions={q} />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      {/* Main work area */}
      <div className="rounded-2xl border border-border bg-card p-5 min-h-[400px]">
        {phase === "upload" && renderUpload()}
        {phase === "extracting" && renderLoading("Mengekstrak teks dari file...")}
        {phase === "preview" && renderPreview()}
        {phase === "generating" && renderLoading("AI sedang membuat ringkasan & soal...")}
        {phase === "result" && renderResult(title, summary, questions, extractedText, isSaved)}
        {phase === "viewing-saved" && viewingPrep && (
          renderResult(viewingPrep.title, viewingPrep.summary, viewingPrep.questions, viewingPrep.extractedText, true)
        )}
      </div>

      {/* Saved list sidebar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookMarked size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">Tersimpan</h2>
          <Badge variant="secondary" className="text-xs">{savedList.length}</Badge>
        </div>

        {savedList.length === 0 ? (
          <p className="text-xs text-muted-foreground rounded-xl border border-dashed border-border p-4 text-center">
            Belum ada yang tersimpan
          </p>
        ) : (
          <div className="space-y-2">
            {savedList.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "rounded-xl border border-border p-3 space-y-1 transition-colors",
                  viewingPrep?.id === p.id ? "border-primary/50 bg-primary/5" : "hover:bg-muted/40"
                )}
              >
                <button
                  onClick={() => handleViewSaved(p.id)}
                  className="w-full text-left"
                >
                  <p className="text-sm font-medium leading-snug line-clamp-2">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </p>
                </button>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(p.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
