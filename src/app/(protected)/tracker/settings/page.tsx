"use client"

import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, Monitor, Moon, Sun, User as UserIcon } from "lucide-react"

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
        {/* Profile Section */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Profil</h2>
          <div className="rounded-xl shadow-xs border border-border bg-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                {session?.user?.image ? (
                  <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-bold text-foreground">{session?.user?.name || "Member"}</p>
                <p className="text-sm text-muted-foreground">{session?.user?.email || "Tidak ada email"}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex border-border gap-2" disabled>
              <UserIcon size={14} /> Edit Profil
            </Button>
          </div>
        </section>

        {/* Preferences */}
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">Tampilan</h2>
          <div className="rounded-xl shadow-xs border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">Tema Aplikasi</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pilih tema warna favorit Anda</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  theme === "light" ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:bg-muted"
                }`}
              >
                <Sun className={`mb-2 ${theme === "light" ? "text-primary" : "text-muted-foreground"}`} size={24} />
                <span className={`text-xs font-semibold ${theme === "light" ? "text-primary" : "text-muted-foreground"}`}>Terang</span>
              </button>
              
              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  theme === "dark" ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:bg-muted"
                }`}
              >
                <Moon className={`mb-2 ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`} size={24} />
                <span className={`text-xs font-semibold ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`}>Gelap</span>
              </button>
              
              <button
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  theme === "system" ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:bg-muted"
                }`}
              >
                <Monitor className={`mb-2 ${theme === "system" ? "text-primary" : "text-muted-foreground"}`} size={24} />
                <span className={`text-xs font-semibold ${theme === "system" ? "text-primary" : "text-muted-foreground"}`}>Sistem</span>
              </button>
            </div>
          </div>
        </section>

        {/* Logout Section */}
        <section>
          <h2 className="text-sm font-semibold text-destructive mb-4 uppercase tracking-wider">Zona Bahaya</h2>
          <div className="rounded-xl shadow-xs border border-border bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Keluar dari akun</p>
              <p className="text-xs text-muted-foreground mt-0.5">Anda harus login kembali untuk mengakses data Anda</p>
            </div>
            <Button
              variant="destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="gap-2 w-full sm:w-auto"
            >
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </section>
      </div>
    </PageWrapper>
  )
}