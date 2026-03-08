"use client"

import { signIn, useSession } from 'next-auth/react'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, ArrowRight, UserCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useGuestStore } from '@/lib/guest-store'

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 100 }
  }
}

const OAUTH_CONNECTIVITY_ERROR_MESSAGE =
  'Koneksi sedang tidak stabil atau tidak tersedia. Silakan periksa koneksi internet Anda dan coba kembali.'

const mapNextAuthErrorToMessage = (errorCode: string | null) => {
  if (!errorCode) return ''

  if (errorCode === 'OAuthSignin' || errorCode === 'OAuthCallback') {
    return OAUTH_CONNECTIVITY_ERROR_MESSAGE
  }

  return ''
}

function LoginPageContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isGuestLoading, setIsGuestLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [oauthErrorMessage] = useState(() =>
    mapNextAuthErrorToMessage(searchParams.get('error'))
  )
  const loginAsGuest = useGuestStore((s) => s.loginAsGuest)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/tracker")
    }
  }, [status, router])

  useEffect(() => {
    if (!oauthErrorMessage) return

    const params = new URLSearchParams(searchParams.toString())
    params.delete('error')
    const nextQuery = params.toString()

    router.replace(nextQuery ? `/login?${nextQuery}` : '/login')
  }, [oauthErrorMessage, searchParams, router])

  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    )
  }

  const handleCredentialsLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes("deactivated")) {
          setError("Akun Anda telah dinonaktifkan. Hubungi administrator.")
        } else {
          setError("Email atau password tidak valid")
        }
        setIsLoading(false)
      } else {
        router.push("/tracker")
      }
    } catch {
      setError("Terjadi kesalahan sistem")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError(OAUTH_CONNECTIVITY_ERROR_MESSAGE)
      return
    }

    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/tracker" })
    } catch {
      setError(OAUTH_CONNECTIVITY_ERROR_MESSAGE)
      setIsLoading(false)
    }
  }

  const handleGuestLogin = () => {
    setIsGuestLoading(true)
    loginAsGuest()
    router.push("/tracker")
  }

  const displayedError = error || oauthErrorMessage

  return (
    <div className="min-h-screen w-full flex bg-background overflow-hidden">
      
      {/* Left Side - Hero / Visuals */}
      <div className="hidden lg:flex w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div 
          className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-primary-foreground/10 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-secondary/30 blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Content Overlay */}
        <div className="relative z-10 max-w-lg px-12 text-primary-foreground">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="flex items-center gap-4 mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/30">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                </div>
                <span className="text-4xl font-bold tracking-wider">VESTAI</span>
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Manage your <br/>
              <span className="text-secondary">Wealth</span> Smarter.
            </h1>
            <p className="text-primary-foreground/80 text-lg mb-8 leading-relaxed">
              Bergabunglah dengan ribuan pengguna lain yang telah mencapai kebebasan finansial melalui platform tracking investasi berbasis AI kami.
            </p>
            
            {/* Stats / Social Proof */}
            <div className="flex gap-8 pt-8 border-t border-primary-foreground/20">
              <div>
                <p className="text-3xl font-bold">10k+</p>
                <p className="text-primary-foreground/70 text-sm">Active Users</p>
              </div>
              <div>
                <p className="text-3xl font-bold">$50M+</p>
                <p className="text-primary-foreground/70 text-sm">Assets Tracked</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-background">
        <motion.div 
          className="w-full max-w-[420px]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header Mobile Only */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
              <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">VESTAI</h2>
          </div>

          {/* Form Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">
              Masukan kredensial Anda untuk mengakses dashboard.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form variants={itemVariants} onSubmit={handleCredentialsLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                disabled={isLoading}
                className="h-11 bg-background border-input focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="h-11 pr-10 bg-background border-input focus:ring-2 focus:ring-ring transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {displayedError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2 border border-destructive/20"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {displayedError}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </motion.form>

          {/* Divider */}
          <motion.div variants={itemVariants} className="my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </motion.div>

          {/* Social Login + Guest */}
          <motion.div variants={itemVariants} className="space-y-3">
            <Button
              variant="outline"
              type="button"
              disabled={isLoading || isGuestLoading}
              onClick={handleGoogleLogin}
              className="w-full h-11 border-border hover:bg-muted transition-colors"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Guest Login */}
            <Button
              variant="outline"
              type="button"
              disabled={isLoading || isGuestLoading}
              onClick={handleGuestLogin}
              className="w-full h-11 border-dashed border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              {isGuestLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserCircle className="mr-2 h-5 w-5" />
              )}
              Continue as Guest
            </Button>
          </motion.div>

          {/* Footer */}
          <motion.p variants={itemVariants} className="mt-8 text-center text-xs text-muted-foreground">
            Guest mode menggunakan penyimpanan lokal. Data tidak akan tersimpan di server.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
