'use client'

import { ReactNode, useEffect, useState } from "react"
import { SidebarProvider } from "../ui/sidebar"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "./relative-navbar"
import { MessagesPanel } from "./messages-panel"

export function SessionWrapper({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [navPosition, setNavPosition] = useState<'left' | 'right' | 'bottom'>('left');
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [activeMessage, setActiveMessage] = useState(false);
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [status, router])
  
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Memuat sesi pengguna...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const messagesPosition = navPosition === 'left' ? 'left' : 'right';

  const handleMessagesOpen = () => {
    setIsMessagesOpen(true);
    setActiveMessage(true); // Aktifkan tab Messages
  };

  const handleMessagesClose = () => {
    setIsMessagesOpen(false);
    setActiveMessage(false); // Matikan tab Messages
  };

  return (
    <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-background w-full">
          <Navbar
            position={navPosition}
            onPositionChange={setNavPosition}
            onOpenMessages={handleMessagesOpen}
            activeMessage={activeMessage}
            userData={session}
          />

          <MessagesPanel
            isOpen={isMessagesOpen}
            onClose={handleMessagesClose}
            position={messagesPosition}
          />
          <div className="flex-1 flex flex-col bg-muted">
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
    </SidebarProvider>
  )
}
