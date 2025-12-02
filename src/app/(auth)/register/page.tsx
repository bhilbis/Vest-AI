"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-label"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
  
    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setIsLoading(true)
      setError("")
  
      const formData = new FormData(e.currentTarget)
      const name = formData.get('name') as string
      const email = formData.get('email') as string
      const password = formData.get('password') as string
  
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        })
  
        const data = await res.json()
        
        if (data.success) {
          router.push("/login")
        } else {
          setError(data.error || "Terjadi kesalahan saat mendaftar")
        }
      } catch (err) {
        console.error(err)
        setError("Terjadi kesalahan. Silakan coba lagi.")
      } finally {
        setIsLoading(false)
      }
    }
  
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Decorative Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-purple-600 via-indigo-600 to-purple-800 relative overflow-hidden">
          {/* Abstract Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
  
          {/* Content */}
          <div className="relative z-10 flex flex-col justify-between p-12 text-white">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-2xl font-bold">Tracker</span>
            </div>
  
            {/* Feature Highlights */}
            <div className="space-y-8">
              <h2 className="text-4xl font-bold leading-tight">
                Mulai Perjalanan Anda Bersama Kami
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Pelacakan Real-time</h3>
                    <p className="text-indigo-200">Monitor progress Anda secara langsung</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Aman & Terpercaya</h3>
                    <p className="text-indigo-200">Data Anda dilindungi dengan enkripsi</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Mudah Digunakan</h3>
                    <p className="text-indigo-200">Interface intuitif untuk semua pengguna</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Right Side - Register Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
          <div className="w-full max-w-md">
            <Card className="border-0 shadow-xl">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-3xl font-bold tracking-tight">Buat Akun Baru</CardTitle>
                <CardDescription className="text-base">
                  Isi formulir di bawah untuk membuat akun Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      required
                      disabled={isLoading}
                    />
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="nama@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimal 8 karakter"
                        required
                        minLength={8}
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                  </div>
  
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mendaftar...
                      </>
                    ) : (
                      "Daftar"
                    )}
                  </Button>
                </form>
  
                {/* Footer Links */}
                <div className="space-y-4 pt-4 border-t">
                  <p className="text-center text-sm text-muted-foreground">
                    Sudah punya akun?{' '}
                    <a href="/login" className="text-primary font-medium hover:underline">
                      Login di sini
                    </a>
                  </p>
                  <p className="text-center text-xs text-muted-foreground">
                    Dengan mendaftar, Anda menyetujui{' '}
                    <a href="#" className="text-primary hover:underline">
                      Syarat & Ketentuan
                    </a>
                    {' '}dan{' '}
                    <a href="#" className="text-primary hover:underline">
                      Kebijakan Privasi
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
  
            {/* Mobile Info */}
            <div className="lg:hidden mt-8 text-center space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Bergabunglah dengan ribuan pengguna lainnya
              </p>
              <p className="text-xs text-muted-foreground">
                Gratis dan mudah untuk memulai
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }