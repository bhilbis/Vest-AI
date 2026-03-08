"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Eye,
  Lock,
  LayoutDashboard,
  PieChart,
  TrendingUp,
  MessageSquare,
  Settings,
  ArrowLeftRight,
  PlusCircle,
  Download,
  Shield,
} from "lucide-react"

const GUEST_WELCOME_SHOWN_KEY = "vest-ai-guest-welcome-shown"

interface FeatureItem {
  icon: React.ElementType
  label: string
  accessible: boolean
  note?: string
}

const features: FeatureItem[] = [
  { icon: LayoutDashboard, label: "Lihat Dashboard & Overview", accessible: true, note: "Tampilan UI tersedia" },
  { icon: Eye, label: "Jelajahi semua halaman", accessible: true, note: "Navigasi penuh" },
  { icon: Settings, label: "Halaman Settings", accessible: true, note: "Tampilan saja" },
  { icon: PlusCircle, label: "Tambah Pengeluaran / Pemasukan", accessible: false, note: "Perlu login" },
  { icon: ArrowLeftRight, label: "Transfer Saldo", accessible: false, note: "Perlu login" },
  { icon: PieChart, label: "Set & Kelola Budget", accessible: false, note: "Perlu login" },
  { icon: TrendingUp, label: "Tambah & Kelola Aset Investasi", accessible: false, note: "Perlu login" },
  { icon: Download, label: "Export Data", accessible: false, note: "Perlu login" },
  { icon: MessageSquare, label: "AI Chat", accessible: false, note: "Perlu login" },
  { icon: Shield, label: "Admin Panel", accessible: false, note: "Khusus admin" },
]

export function GuestWelcomeDialog() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Show only once per guest session
    const shown = sessionStorage.getItem(GUEST_WELCOME_SHOWN_KEY)
    if (!shown) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setOpen(true), 600)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    sessionStorage.setItem(GUEST_WELCOME_SHOWN_KEY, "true")
    setOpen(false)
  }

  const accessible = features.filter((f) => f.accessible)
  const restricted = features.filter((f) => !f.accessible)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            👋 Selamat Datang, Guest!
          </DialogTitle>
          <DialogDescription className="text-sm">
            Kamu masuk dalam mode Guest. Data tidak disimpan ke server — hanya tersimpan di browser ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Accessible features */}
          <div>
            <h3 className="text-sm font-bold text-chart-1 flex items-center gap-1.5 mb-2">
              <Eye className="h-4 w-4" />
              Bisa Diakses
            </h3>
            <div className="space-y-1.5">
              {accessible.map((f) => (
                <div key={f.label} className="flex items-center gap-3 rounded-xl border border-chart-1/20 bg-chart-1/5 px-3 py-2.5">
                  <div className="h-7 w-7 rounded-lg bg-chart-1/10 flex items-center justify-center shrink-0">
                    <f.icon className="h-3.5 w-3.5 text-chart-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{f.label}</p>
                    {f.note && <p className="text-[11px] text-muted-foreground">{f.note}</p>}
                  </div>
                  <span className="text-[10px] font-bold text-chart-1 bg-chart-1/10 px-2 py-0.5 rounded-full shrink-0">✓ OK</span>
                </div>
              ))}
            </div>
          </div>

          {/* Restricted features */}
          <div>
            <h3 className="text-sm font-bold text-destructive flex items-center gap-1.5 mb-2">
              <Lock className="h-4 w-4" />
              Tidak Bisa Diakses (Perlu Login)
            </h3>
            <div className="space-y-1.5">
              {restricted.map((f) => (
                <div key={f.label} className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 opacity-75">
                  <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                    <f.icon className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{f.label}</p>
                    {f.note && <p className="text-[11px] text-muted-foreground">{f.note}</p>}
                  </div>
                  <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full shrink-0">🔒</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center space-y-2">
            <p className="text-sm font-bold">Mau akses penuh? 🚀</p>
            <p className="text-xs text-muted-foreground">Login atau daftar untuk menggunakan semua fitur tanpa batasan.</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleClose} className="font-bold">
            Mengerti, Lanjutkan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
