'use client'

import { ReactNode, useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useGuestStore } from "@/lib/guest-store"
import { AppSidebar } from "./app-sidebar"
import { BottomNav } from "./bottom-nav"
import { MessagesPanel } from "./messages-panel"
import { GuestWelcomeDialog } from "./guest-welcome-dialog"
import { LogOut, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SessionWrapper({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [isMessagesOpen, setIsMessagesOpen] = useState(false)
  const router = useRouter()
  const isMobile = useIsMobile()

  const { isGuest, guestName, logoutGuest, hydrate, _hydrated } = useGuestStore()

  useEffect(() => { hydrate() }, [hydrate])

  useEffect(() => {
    if (!_hydrated) return
    if (status === "unauthenticated" && !isGuest) {
      router.replace("/login")
    }
  }, [status, router, isGuest, _hydrated])

  if (!_hydrated || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    )
  }

  const isAuthenticated = status === "authenticated"
  if (!isAuthenticated && !isGuest) return null

  const handleLogoutGuest = () => {
    logoutGuest()
    router.replace("/login")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background w-full">
      {/* Guest Mode Banner */}
      {isGuest && (
        <>
          <div className="fixed top-0 left-0 right-0 z-60 bg-zinc-800 text-zinc-300 text-center py-2 px-4 text-xs font-medium flex items-center justify-center gap-3 border-b border-zinc-700">
            <span>🔓 Mode Guest — Data hanya tersimpan di browser</span>
            <button
              onClick={handleLogoutGuest}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-[11px] font-medium transition-colors"
            >
              <LogOut size={10} />
              Keluar
            </button>
          </div>
          <GuestWelcomeDialog />
        </>
      )}

      {/* Desktop: Sidebar (Left) */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main
          className="flex-1 overflow-y-auto"
          style={{
            paddingTop: isGuest ? '40px' : undefined,
            paddingBottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : undefined,
          }}
        >
          {children}
        </main>
      </div>

      {/* Floating AI Chat Toggle (Desktop only, right side) */}
      {!isMobile && !isMessagesOpen && (
        <Button
          onClick={() => setIsMessagesOpen(true)}
          size="icon"
          className={cn(
            "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full",
            "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white",
            "border border-zinc-700 shadow-lg shadow-black/30",
            "transition-all duration-200 hover:scale-105"
          )}
        >
          <MessageSquare size={20} />
        </Button>
      )}

      {/* AI Chat Panel (Right side — dual-panel symmetry) */}
      <MessagesPanel
        isOpen={isMessagesOpen}
        onClose={() => setIsMessagesOpen(false)}
        position="right"
      />

      {/* Mobile: Bottom Nav */}
      <BottomNav />
    </div>
  )
}