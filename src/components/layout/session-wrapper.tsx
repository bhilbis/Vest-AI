'use client'

import { ReactNode, useEffect, useState } from "react"
import { SidebarProvider } from "../ui/sidebar"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "./relative-navbar"
import { MessagesPanel } from "./messages-panel"
import { useIsMobile } from "@/hooks/use-mobile"
import { useGuestStore } from "@/lib/guest-store"
import { GuestWelcomeDialog } from "./guest-welcome-dialog"
import { LogOut } from "lucide-react"

export function SessionWrapper({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [navPosition, setNavPosition] = useState<'left' | 'right' | 'bottom' | 'top'>('left');
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState(false);
  const router = useRouter()
  const isMobile = useIsMobile();

  // Guest store
  const { isGuest, guestId, guestName, logoutGuest, hydrate, _hydrated } = useGuestStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!_hydrated) return;
    if (status === "unauthenticated" && !isGuest) {
      router.replace("/login")
    }
  }, [status, router, isGuest, _hydrated])

  if (!_hydrated || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Memuat sesi pengguna...</p>
      </div>
    )
  }

  const isAuthenticated = status === "authenticated";
  
  // If neither authenticated nor guest, show nothing (will redirect)
  if (!isAuthenticated && !isGuest) {
    return null
  }

  const handleLogoutGuest = () => {
    logoutGuest();
    router.replace("/login");
  };

  // Build userData for navbar
  const userData = isAuthenticated
    ? session
    : {
        user: {
          id: guestId ?? "guest",
          name: guestName,
          email: null,
          image: null,
          role: "GUEST",
        },
      };

  const messagesPosition = navPosition === 'left' ? 'left' : 'right';
  const effectivePosition = isMobile ? 'bottom' : navPosition;

  const handleMessagesOpen = () => {
    setIsMessagesOpen(true);
    setActiveMessage(true);
  };

  const handleMessagesClose = () => {
    setIsMessagesOpen(false);
    setActiveMessage(false);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background w-full">
        {/* Guest Mode Banner */}
        {isGuest && (
          <>
            <div className="fixed top-0 left-0 right-0 z-60 bg-amber-500/90 backdrop-blur-sm text-amber-950 text-center py-1.5 px-4 text-sm font-medium flex items-center justify-center gap-3">
              <span>🔓 Mode Guest — Data tersimpan di browser Anda saja</span>
              <button
                onClick={handleLogoutGuest}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-700/20 hover:bg-amber-700/30 text-amber-950 text-xs font-semibold transition-colors"
              >
                <LogOut size={12} />
                Keluar
              </button>
            </div>
            <GuestWelcomeDialog />
          </>
        )}

        <Navbar
          position={navPosition}
          onPositionChange={setNavPosition}
          onOpenMessages={handleMessagesOpen}
          activeMessage={activeMessage}
          userData={userData}
        />

        <MessagesPanel
          isOpen={isMessagesOpen}
          onClose={handleMessagesClose}
          position={messagesPosition}
        />

        <div className="flex-1 flex flex-col bg-muted">
          <main
            className="flex-1 overflow-y-auto"
            style={{
              paddingTop: isGuest ? '36px' : undefined,
              paddingBottom: isMobile
                ? 'calc(72px + env(safe-area-inset-bottom))'
                : undefined,
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}