"use client"

import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

function SettingRow({
  icon,
  label,
  description,
  action,
  danger = false,
}: {
  icon: React.ReactNode
  label: string
  description?: string
  action: React.ReactNode
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 px-5">
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
}

function SectionCard({ children, divider = true }: { children: React.ReactNode; divider?: boolean }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", divider && "[&>*+*]:border-t [&>*+*]:border-border/60")}>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  return (
    <PageWrapper maxWidth="md" className="space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola akun dan preferensi aplikasi Anda</p>
      </header>

      <div className="space-y-8">

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
              <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5" disabled>
                <UserIcon size={13} /> Edit Profil
              </Button>
            </div>
          </SectionCard>
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
              action={
                <Badge variant="secondary" className="text-[10px]">Segera Hadir</Badge>
              }
            />
            <SettingRow
              icon={<Globe size={15} />}
              label="Notifikasi Email"
              description="Laporan keuangan mingguan via email"
              action={
                <Badge variant="secondary" className="text-[10px]">Segera Hadir</Badge>
              }
            />
            <SettingRow
              icon={<BellOff size={15} />}
              label="Mode Senyap"
              description="Nonaktifkan semua notifikasi sementara"
              action={
                <Badge variant="secondary" className="text-[10px]">Segera Hadir</Badge>
              }
            />
          </SectionCard>
        </section>

        {/* ── Keamanan ── */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Keamanan & Privasi</h2>
          <SectionCard>
            <SettingRow
              icon={<KeyRound size={15} />}
              label="Ubah Password"
              description="Perbarui kata sandi akun Anda"
              action={
                <Button variant="outline" size="sm" disabled className="text-xs h-7">
                  Ubah
                </Button>
              }
            />
            <SettingRow
              icon={<Shield size={15} />}
              label="Autentikasi Dua Faktor"
              description="Tambahkan lapisan keamanan ekstra"
              action={
                <Badge variant="secondary" className="text-[10px]">Segera Hadir</Badge>
              }
            />
            <SettingRow
              icon={<Smartphone size={15} />}
              label="Sesi Aktif"
              description="Lihat perangkat yang login ke akun ini"
              action={
                <Badge variant="secondary" className="text-[10px]">Segera Hadir</Badge>
              }
            />
            <SettingRow
              icon={<Lock size={15} />}
              label="Privasi Data"
              description="Atur siapa yang bisa melihat data Anda"
              action={
                <ChevronRight size={15} className="text-muted-foreground" />
              }
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
                <Button variant="outline" size="sm" disabled className="text-xs h-7 gap-1.5">
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
                <Button variant="outline" size="sm" disabled className="text-xs h-7 border-destructive/30 text-destructive hover:bg-destructive/10">
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
              action={
                <Badge variant="outline" className="text-[10px] font-mono">v0.1.0</Badge>
              }
            />
            <SettingRow
              icon={<ExternalLink size={15} />}
              label="Kebijakan Privasi"
              description="Baca kebijakan penggunaan data kami"
              action={
                <ChevronRight size={15} className="text-muted-foreground" />
              }
            />
            <SettingRow
              icon={<ExternalLink size={15} />}
              label="Syarat & Ketentuan"
              description="Aturan penggunaan layanan Vest AI"
              action={
                <ChevronRight size={15} className="text-muted-foreground" />
              }
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
