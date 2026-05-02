"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"
import { GraduationCap, BookOpen, BarChart3, Settings2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MessagesPanel } from "@/components/layout/messages-panel"

interface KuliahLayoutContextType {
  isChatOpen: boolean
  setIsChatOpen: (open: boolean) => void
  setInitialMessage: (msg: string) => void
}

const KuliahLayoutContext = createContext<KuliahLayoutContextType | undefined>(undefined)

export const useKuliahLayout = () => {
  const context = useContext(KuliahLayoutContext)
  if (!context) throw new Error("useKuliahLayout must be used within KuliahLayout")
  return context
}

const kuliahNav = [
  { title: "Tracker", url: "/kuliah/tracker", icon: BookOpen },
  { title: "Nilai", url: "/kuliah/nilai", icon: BarChart3 },
  { title: "Pengaturan", url: "/kuliah/settings", icon: Settings2 },
]

export default function KuliahLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [initialMessage, setInitialMessage] = useState("")

  return (
    <KuliahLayoutContext.Provider value={{ isChatOpen, setIsChatOpen, setInitialMessage }}>
      <div className="w-full">
        {/* Header */}
        <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
            {/* Title */}
            <div className="flex items-center justify-between gap-3 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-foreground">
                    Kuliah Tracker
                  </h1>
                  <p className="text-[11px] text-muted-foreground">
                    Tracking pengerjaan akademik UT
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="h-9 text-xs gap-1.5"
              >
                <MessageSquare size={16} />
                Chat AI
              </Button>
            </div>

            {/* Sub Navigation Tabs */}
            <nav className="flex gap-1 -mb-px">
              {kuliahNav.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                return (
                  <Link
                    key={item.title}
                    href={item.url}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-t-lg",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon size={15} strokeWidth={isActive ? 2 : 1.5} />
                    <span>{item.title}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 animate-page-enter">
          {children}
        </div>

        <MessagesPanel 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          position="right" 
        />
      </div>
    </KuliahLayoutContext.Provider>
  )
}
