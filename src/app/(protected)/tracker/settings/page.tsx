"use client"

import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  LogOut,
  Monitor,
  Moon,
  Sun,
  User as UserIcon,
  Bell,
  BellOff,
  Shield,
  KeyRound,
  Smartphone,
  Download,
  Trash2,
  Info,
  ExternalLink,
  ChevronRight,
  Globe,
  Lock,
  Link2,
  Link2Off,
  Eye,
  EyeOff,
  Loader2,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCallback, useEffect, useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"

interface LinkedProvider {
  provider: string
  id: string
}

interface LinkedAccountsState {
  hasPassword: boolean
  providers: LinkedProvider[]
}

function SettingRow({
  icon,
  label,
  description,
  action,
  danger = false,
  href,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  action: React.ReactNode
  danger?: boolean
  href?: string
}) {
  const inner = (
    <div className={cn(
      "flex items-center justify-between gap-4 py-3.5 px-5",
      href && "cursor-pointer hover:bg-muted/50 transition-colors"
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
          danger ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
        )}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={cn("text-sm font-medium", danger ? "text-destructive" : "text-foreground")}>{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>}
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
  if (href) {
    return <Link href={href}>{inner}</Link>
  }
  return inner
}

function SectionCard({ children, divider = true }: { children: React.ReactNode; divider?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", divider && "[&>*+*]:border-t [&>*+*]:border-border/60")}>
      {children}
    </div>
  )
}

function GoogleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function SetPasswordForm({
  hasPassword,
  onSuccess,
}: {
  hasPassword: boolean
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/linked-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword, currentPassword: hasPassword ? currentPassword : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan password")
      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setCurrentPassword("")
        setNewPassword("")
        onSuccess()
      }, 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs h-7"
        onClick={() => setOpen(true)}
      >
        {hasPassword ? "Ubah" : "Tambah"}
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full px-5 pb-4 pt-2 space-y-3 border-t border-border/60">
      {hasPassword && (
        <div className="space-y-1.5">
          <Label htmlFor="current-password" className="text-xs">Password Saat Ini</Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Password lama"
              required
              className="pr-9 h-8 text-sm"
            />
            <button
              type="button"
              aria-label="Toggle visibility"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCurrent ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="new-password" className="text-xs">{hasPassword ? "Password Baru" : "Buat Password"}</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            required
            minLength={8}
            className="pr-9 h-8 text-sm"
          />
          <button
            type="button"
            aria-label="Toggle visibility"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showNew ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-7 text-xs" disabled={loading || success}>
          {success ? <Check size={12} className="mr-1" /> : loading ? <Loader2 size={12} className="mr-1 animate-spin" /> : null}
          {success ? "Tersimpan" : "Simpan"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => { setOpen(false); setError(""); }}
        >
          Batal
        </Button>
      </div>
    </form>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [linked, setLinked] = useState<LinkedAccountsState | null>(null)
  const [unlinkLoading, setUnlinkLoading] = useState<string | null>(null)
  const [unlinkError, setUnlinkError] = useState("")

  const fetchLinked = useCallback(async () => {
    const res = await fetch("/api/auth/linked-accounts")
    if (res.ok) setLinked(await res.json())
  }, [])

  useEffect(() => { fetchLinked() }, [fetchLinked])

  const handleUnlink = async (provider: string) => {
    setUnlinkLoading(provider)
    setUnlinkError("")
    try {
      const res = await fetch("/api/auth/linked-accounts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal melepas koneksi")
      fetchLinked()
    } catch (err) {
      setUnlinkError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setUnlinkLoading(null)
    }
  }

  const isGoogleLinked = linked?.providers.some((p) => p.provider === "google") ?? false

  return (
    <PageWrapper maxWidth="lg" className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola akun dan preferensi aplikasi Anda</p>
      </header>

      <div className="space-y-6">

        {/* ── Profil ── */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Profil</h2>
          <SectionCard divider={false}>
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                  {session?.user?.image && (
                    <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-bold text-foreground">{session?.user?.name || "Member"}</p>
                  <p className="text-sm text-muted-foreground">{session?.user?.email || "Tidak ada email"}</p>
                  <Badge variant="secondary" className="mt-1 text-[10px] h-4 px-1.5">
                    {(session?.user as { role?: string })?.role === "ADMIN" ? "Admin" : "Member"}
                  </Badge>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="hidden sm:flex gap-1.5" disabled>
                <UserIcon size={13} /> Edit Profil
              </Button>
            </div>
          </SectionCard>
        </section>

        {/* ── Akun Terhubung ── */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Akun Terhubung</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">

            {/* Google */}
            <div className="flex items-center justify-between gap-4 py-3.5 px-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                  <GoogleIcon size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Google</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isGoogleLinked ? "Terhubung — bisa login via Google" : "Belum terhubung"}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {isGoogleLinked ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                    disabled={unlinkLoading === "google"}
                    onClick={() => handleUnlink("google")}
                  >
                    {unlinkLoading === "google" ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Link2Off size={11} />
                    )}
                    Putuskan
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 gap-1.5"
                    onClick={() => signIn("google", { callbackUrl: "/tracker/settings" })}
                  >
                    <Link2 size={11} /> Hubungkan
                  </Button>
                )}
              </div>
            </div>

            {/* Credentials (Password) */}
            <div className="border-t border-border/60">
              <div className="flex items-center justify-between gap-4 py-3.5 px-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                    <KeyRound size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Login dengan Password</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {linked?.hasPassword ? "Password sudah diatur" : "Belum ada password — hanya bisa login via Google"}
                    </p>
                  </div>
                </div>
                {linked && (
                  <SetPasswordForm hasPassword={linked.hasPassword} onSuccess={fetchLinked} />
                )}
              </div>
            </div>

            {unlinkError && (
              <div className="px-5 pb-3 text-xs text-destructive">{unlinkError}</div>
            )}
          </div>
        </section>

        {/* ── Tampilan ── */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Tampilan</h2>
          <SectionCard divider={false}>
            <div className="px-5 pt-4 pb-2">
              <p className="text-sm font-medium text-foreground">Tema Aplikasi</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pilih tema tampilan favorit Anda</p>
            </div>
            <div className="px-5 pb-5 grid grid-cols-3 gap-3 mt-3">
              {([
                { key: "light", label: "Terang", icon: Sun },
                { key: "dark", label: "Gelap", icon: Moon },
                { key: "system", label: "Sistem", icon: Monitor },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer",
                    theme === key
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-card hover:bg-muted"
                  )}
                >
                  <Icon
                    size={22}
                    className={cn("mb-2", theme === key ? "text-primary" : "text-muted-foreground")}
                  />
                  <span className={cn("text-xs font-semibold", theme === key ? "text-primary" : "text-muted-foreground")}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>
        </section>

        {/* ── Notifikasi ── */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Notifikasi</h2>
          <SectionCard>
            <SettingRow
              icon={<Bell size={15} />}
              label="Notifikasi Push"
              description="Pengingat transaksi dan batas budget"
              action={<Badge variant="secondary" className="text-[10px]">Segera Hadir</Badge>}
            />
            <SettingRow
              icon={<Globe size={15} />}
              label="Notifikasi Email"
              description="Laporan keuangan mingguan via email"
              action={<Badge variant="secondary" className="text-[10px]">Segera Hadir</Badge>}
            />
            <SettingRow
              icon={<BellOff size={15} />}
              label="Mode Senyap"
              description="Nonaktifkan semua notifikasi sementara"
              action={<Badge variant="secondary" className="text-[10px]">Segera Hadir</Badge>}
            />
          </SectionCard>
        </section>

        {/* ── Keamanan ── */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Keamanan & Privasi</h2>
          <SectionCard>
            <SettingRow
              icon={<Shield size={15} />}
              label="Autentikasi Dua Faktor"
              description="Tambahkan lapisan keamanan ekstra"
              action={<Badge variant="secondary" className="text-[10px]">Segera Hadir</Badge>}
            />
            <SettingRow
              icon={<Smartphone size={15} />}
              label="Sesi Aktif"
              description="Lihat perangkat yang login ke akun ini"
              action={<Badge variant="secondary" className="text-[10px]">Segera Hadir</Badge>}
            />
            <SettingRow
              icon={<Lock size={15} />}
              label="Privasi Data"
              description="Atur siapa yang bisa melihat data Anda"
              action={<ChevronRight size={15} className="text-muted-foreground" />}
            />
          </SectionCard>
        </section>

        {/* ── Data & Ekspor ── */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Data & Ekspor</h2>
          <SectionCard>
            <SettingRow
              icon={<Download size={15} />}
              label="Ekspor Data Keuangan"
              description="Unduh seluruh data transaksi sebagai CSV"
              action={
                <Button type="button" variant="outline" size="sm" disabled className="text-xs h-7 gap-1.5">
                  <Download size={12} /> Ekspor
                </Button>
              }
            />
            <SettingRow
              icon={<Trash2 size={15} />}
              label="Hapus Semua Data"
              description="Hapus permanen seluruh data transaksi & budget"
              danger
              action={
                <Button type="button" variant="outline" size="sm" disabled className="text-xs h-7 border-destructive/30 text-destructive hover:bg-destructive/10">
                  Hapus
                </Button>
              }
            />
          </SectionCard>
        </section>

        {/* ── Tentang ── */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Tentang Aplikasi</h2>
          <SectionCard>
            <SettingRow
              icon={<Info size={15} />}
              label="Versi Aplikasi"
              description="Vest AI · Personal Finance Manager"
              action={<Badge variant="outline" className="text-[10px] font-mono">v1.1.6-security-seo</Badge>}
            />
            <SettingRow
              icon={<ExternalLink size={15} />}
              label="Kebijakan Privasi"
              description="Baca kebijakan penggunaan data kami"
              href="/kebijakan-privasi"
              action={<ChevronRight size={15} className="text-muted-foreground" />}
            />
            <SettingRow
              icon={<ExternalLink size={15} />}
              label="Syarat & Ketentuan"
              description="Aturan penggunaan layanan Vest AI"
              href="/syarat-ketentuan"
              action={<ChevronRight size={15} className="text-muted-foreground" />}
            />
          </SectionCard>
        </section>

        {/* ── Zona Bahaya ── */}
        <section>
          <h2 className="text-xs font-semibold text-destructive mb-3 uppercase tracking-wider">Zona Bahaya</h2>
          <SectionCard divider={false}>
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <LogOut size={15} className="text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Keluar dari akun</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Anda harus login kembali untuk mengakses data Anda</p>
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="gap-2 w-full sm:w-auto"
              >
                <LogOut size={15} /> Logout
              </Button>
            </div>
          </SectionCard>
        </section>

      </div>
    </PageWrapper>
  )
}
