"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/login")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Registrasi saat ini tidak tersedia.</p>
        <p className="text-sm text-muted-foreground">Mengarahkan ke halaman login...</p>
      </div>
    </div>
  )
}