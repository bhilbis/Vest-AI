"use client"

import { signIn, useSession } from 'next-auth/react'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, UserCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useGuestStore } from '@/lib/guest-store'

const OAUTH_ERROR_MSG =
  'Koneksi tidak stabil. Periksa internet Anda dan coba kembali.'

const mapOAuthError = (code: string | null) => {
  if (!code) return ''
  if (code === 'OAuthSignin' || code === 'OAuthCallback') return OAUTH_ERROR_MSG
  return ''
}

/* ─── Sparkline SVG ─── */
function Sparkline({ color = '#4ade80' }: { color?: string }) {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" fill="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points="0,22 12,18 24,20 36,11 48,7 60,13 72,3"
        stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"
      />
      <polygon
        points="0,22 12,18 24,20 36,11 48,7 60,13 72,3 72,28 0,28"
        fill="url(#sg)"
      />
    </svg>
  )
}

/* ─── Mini progress bar ─── */
function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ delay: 0.9, duration: 1, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: 99, background: color }}
      />
    </div>
  )
}

/* ─── Floating dashboard card ─── */
function DashCard({
  style, delay = 0, children,
}: { style?: React.CSSProperties; delay?: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute',
        borderRadius: 16,
        background: 'rgba(12, 28, 16, 0.82)',
        border: '1px solid rgba(74, 222, 128, 0.13)',
        backdropFilter: 'blur(12px)',
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(74,222,128,0.08) inset',
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}

/* ─── StyledInput ─── */
function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      className="w-full outline-none"
      style={{
        height: 50,
        padding: '0 14px',
        borderRadius: 12,
        border: `1.5px solid ${focused ? '#4caf50' : '#d0e8d0'}`,
        background: '#fff',
        fontSize: 15,
        color: '#0d1a0f',
        boxShadow: focused ? '0 0 0 3.5px rgba(76,175,80,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'border-color 0.18s, box-shadow 0.18s',
        ...props.style,
      }}
    />
  )
}

/* ════════════════════════════════════════════════════════ */
function LoginPageContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)
  const [isGuestLoading, setIsGuestLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [btnHover, setBtnHover] = useState(false)
  const [altText, setAltText] = useState(false)

  const [oauthError] = useState(() => mapOAuthError(searchParams.get('error')))
  const loginAsGuest = useGuestStore(s => s.loginAsGuest)
  const logoutGuest = useGuestStore(s => s.logoutGuest)

  /* Text changes after arrow exits */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!btnHover) { setAltText(false); return }
    const t = setTimeout(() => setAltText(true), 300)
    return () => clearTimeout(t)
  }, [btnHover])

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard')
  }, [status, router])

  useEffect(() => {
    if (!oauthError) return
    const p = new URLSearchParams(searchParams.toString())
    p.delete('error')
    const q = p.toString()
    router.replace(q ? `/login?${q}` : '/login')
  }, [oauthError, searchParams, router])

  if (status === 'authenticated') {
    return (
      <div className="h-screen w-full flex items-center justify-center" style={{ background: '#f5fdf0' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4caf50' }} />
      </div>
    )
  }

  /* ─── Handlers ─── */
  const handleCredentials = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true); setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const result = await signIn('credentials', {
        email: fd.get('email') as string,
        password: fd.get('password') as string,
        redirect: false,
      })
      if (result?.error) {
        setError(result.error.includes('deactivated')
          ? 'Akun Anda telah dinonaktifkan. Hubungi administrator.'
          : 'Email atau password tidak valid.')
        setIsLoading(false)
      } else {
        logoutGuest()
        router.push('/dashboard')
      }
    } catch {
      setError('Terjadi kesalahan sistem.')
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    if (typeof navigator !== 'undefined' && !navigator.onLine) { setError(OAUTH_ERROR_MSG); return }
    setIsLoading(true); logoutGuest()
    try { await signIn('google', { callbackUrl: '/dashboard' }) }
    catch { setError(OAUTH_ERROR_MSG); setIsLoading(false) }
  }

  const handleGuest = () => { setIsGuestLoading(true); loginAsGuest(); router.push('/dashboard') }

  const displayedError = error || oauthError

  /* ════════════════════════════════════════ RENDER ════════════════════════════════════════ */
  return (
    /* Page background — right form menyatu dengan ini */
    <div
      className="w-full flex items-center justify-center"
      style={{
        minHeight: '100svh',
        padding: '14px',
        background: `
          radial-gradient(ellipse 80% 65% at 100% 0%, rgba(166,220,120,0.52) 0%, rgba(210,245,180,0.22) 42%, transparent 65%),
          #f3fcee
        `,
      }}
    >
      <div className="flex items-stretch w-full" style={{ gap: 'clamp(40px, 5vw, 72px)' }}>

      {/* ══════════════════════════ LEFT CARD (floating) ══════════════════════════ */}
      <div
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{
          width: '46%',
          minHeight: 'calc(100svh - 28px)',
          background: '#080f09',
          borderRadius: 22,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        }}
      >
        {/* ── Abstract teal/cyan curved surface — seperti referensi ── */}

        {/* Layer 1: Main abstract 3D shape — bright teal/cyan blob di tengah-kanan */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse 72% 58% at 68% 54%,
              rgba(0,200,160,0.82) 0%,
              rgba(0,155,115,0.58) 22%,
              rgba(0,90,65,0.32) 48%,
              transparent 68%)
          `,
        }} />

        {/* Layer 2: Highlight surface — kesan cahaya di permukaan 3D */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: `
            radial-gradient(ellipse 42% 35% at 58% 42%,
              rgba(160,240,220,0.38) 0%,
              rgba(80,200,170,0.18) 35%,
              transparent 65%)
          `,
        }} />

        {/* Layer 3: Dark forest green — pojok kiri bawah */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: `
            radial-gradient(ellipse 65% 55% at -5% 95%,
              rgba(10,80,50,0.85) 0%,
              rgba(5,45,28,0.55) 40%,
              transparent 65%)
          `,
        }} />

        {/* Layer 4: Dark overlay top — supaya text headline terbaca */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '48%', zIndex: 2,
          background: 'linear-gradient(180deg, rgba(6,11,7,0.92) 0%, rgba(6,11,7,0.45) 65%, transparent 100%)',
        }} />

        {/* Layer 5: Dark fade bottom — supaya cards lebih mudah dibaca */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%', zIndex: 2,
          background: 'linear-gradient(0deg, rgba(4,9,5,0.96) 0%, transparent 100%)',
        }} />

        {/* ── Floating dashboard cards ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }}>

          {/* Card 1 — Total Aset (back-left) */}
          <DashCard
            delay={0.5}
            style={{ width: 220, bottom: '24%', left: '6%', transform: 'rotate(-5deg)' }}
          >
            <p style={{ fontSize: 10, color: 'rgba(74,222,128,0.7)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 6 }}>
              TOTAL ASET
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
              Rp 125,4 Jt
            </p>
            <div className="flex items-center justify-between">
              <Sparkline color="#4ade80" />
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#4ade80',
                background: 'rgba(74,222,128,0.12)', borderRadius: 6, padding: '2px 7px',
              }}>
                +12.5%
              </span>
            </div>
          </DashCard>

          {/* Card 2 — Anggaran Bulan Ini (front-center) */}
          <DashCard
            delay={0.65}
            style={{ width: 234, bottom: '13%', left: '26%', transform: 'rotate(3deg)' }}
          >
            <p style={{ fontSize: 10, color: 'rgba(74,222,128,0.7)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 8 }}>
              ANGGARAN BULAN INI
            </p>
            <div className="flex items-end justify-between" style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Rp 2,4 Jt</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>/ Rp 4 Jt</p>
            </div>
            <MiniBar pct={60} color="linear-gradient(90deg,#4ade80,#22c55e)" />
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>60% terpakai</p>
          </DashCard>

          {/* Card 3 — Akademik IPK (back-right) */}
          <DashCard
            delay={0.8}
            style={{ width: 206, bottom: '26%', right: '5%', transform: 'rotate(6deg)' }}
          >
            <p style={{ fontSize: 10, color: 'rgba(74,222,128,0.7)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 6 }}>
              IPK SEMESTER INI
            </p>
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>3.87</p>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', alignSelf: 'flex-end', paddingBottom: 4 }}>/&nbsp;4.00</span>
            </div>
            <div className="flex gap-1">
              {[1,2,3,4].map(i => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 99,
                  background: i <= 3 ? '#4ade80' : 'rgba(255,255,255,0.1)',
                }} />
              ))}
            </div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>15 mata kuliah aktif</p>
          </DashCard>

        </div>

        {/* ── Headline & brand ── */}
        <div className="relative flex flex-col h-full" style={{ zIndex: 4, padding: 'clamp(36px, 4vw, 56px)' }}>
          {/* Brand top-left */}
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg,#4caf50,#2e7d32)',
              boxShadow: '0 0 18px rgba(76,175,80,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 700, letterSpacing: '0.12em', fontSize: 14 }}>VESTAI</p>
              <p style={{ color: 'rgba(74,222,128,0.55)', fontSize: 11 }}>Smart Finance with AI</p>
            </div>
          </motion.div>

          {/* Spacer top */}
          <div style={{ flex: '0 0 clamp(32px, 8vh, 72px)' }} />

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 style={{
              color: '#fff',
              fontWeight: 800,
              fontSize: 'clamp(28px, 2.8vw, 44px)',
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              maxWidth: 340,
              textShadow: '0 2px 16px rgba(0,0,0,0.6)',
            }}>
              Kelola keuangan &<br />akademik Anda<br />
              <span style={{ color: '#4ade80' }}>lebih cerdas.</span>
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 14,
              marginTop: 14,
              lineHeight: 1.6,
              maxWidth: 300,
            }}>
              Pantau aset, anggaran, dan prestasi akademik<br />dalam satu platform berbasis AI.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════ RIGHT FORM (transparan, menyatu dengan bg) ══════════════════════════ */}
      <div className="flex-1 flex items-center justify-center" style={{ minWidth: 0 }}>
        <motion.div
          className="w-full"
          style={{ maxWidth: 500 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >

          {/* Mobile logo */}
          <motion.div
            className="lg:hidden flex items-center gap-2 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#4caf50',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0d1a0f', letterSpacing: '0.06em' }}>VESTAI</span>
          </motion.div>

          {/* Heading */}
          <div style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 'clamp(24px, 2.4vw, 34px)',
              fontWeight: 800,
              color: '#0d1a0f',
              letterSpacing: '-0.025em',
              marginBottom: 8,
            }}>
              Sign In
            </h2>
            <p style={{ fontSize: 15, color: '#7a9a7e', lineHeight: 1.5 }}>
              Masukkan kredensial Anda untuk mengakses dashboard.
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1a2b1d', marginBottom: 9 }}>
                Email Address <span style={{ color: '#d94040' }}>*</span>
              </label>
              <StyledInput id="email" name="email" type="email" placeholder="name@example.com" required disabled={isLoading} />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 9 }}>
                <label htmlFor="password" style={{ fontSize: 13, fontWeight: 600, color: '#1a2b1d' }}>
                  Password <span style={{ color: '#d94040' }}>*</span>
                </label>
                <a href="#" style={{ fontSize: 12, color: '#3a9e50', fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#276334')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#3a9e50')}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <StyledInput
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  required disabled={isLoading}
                  style={{ paddingRight: 46 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    color: '#aac4aa', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#3a9e50')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#aac4aa')}
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {displayedError && (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    borderRadius: 12, padding: '12px 14px',
                    background: 'rgba(215,50,50,0.07)',
                    border: '1px solid rgba(215,50,50,0.2)',
                    fontSize: 13, color: '#b83030',
                  }}
                >
                  <svg className="w-4 h-4 shrink-0" style={{ marginTop: 1 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {displayedError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ══ Sign In Button ══ */}
            <motion.button
              type="submit"
              disabled={isLoading}
              onHoverStart={() => !isLoading && setBtnHover(true)}
              onHoverEnd={() => { setBtnHover(false) }}
              whileTap={{ scale: 0.975 }}
              style={{
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                height: 54,
                borderRadius: 14,
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                background: '#8fcc3a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                fontWeight: 700,
                fontSize: 15,
                color: '#0d2206',
                boxShadow: '0 4px 20px rgba(100,180,40,0.32)',
              }}
            >
              {/* Darker bg sweep — slides in from left on hover */}
              <motion.div
                aria-hidden
                style={{
                  position: 'absolute', inset: 0, zIndex: 0,
                  background: 'linear-gradient(90deg, #5a9e1c 0%, #72b82a 100%)',
                  pointerEvents: 'none',
                }}
                initial={false}
                animate={{ x: btnHover ? '0%' : '-101%' }}
                transition={{ duration: 0.32, ease: [0.32, 0, 0.2, 1] }}
              />

              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" style={{ position: 'relative', zIndex: 1 }} />
              ) : (
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>

                  {/* Arrow circle — exits right on hover */}
                  <motion.span
                    animate={{
                      x: btnHover ? 220 : 0,
                      opacity: btnHover ? 0 : 1,
                      scale: btnHover ? 0.8 : 1,
                    }}
                    transition={{ duration: 0.32, ease: [0.4, 0, 1, 1] }}
                    style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </motion.span>

                  {/* Text — swaps after arrow exits */}
                  <AnimatePresence mode="wait">
                    {!altText ? (
                      <motion.span
                        key="main"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.18 }}
                      >
                        Sign In Now
                      </motion.span>
                    ) : (
                      <motion.span
                        key="alt"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        style={{ letterSpacing: '-0.01em' }}
                      >
                        Welcome back! 🎉
                      </motion.span>
                    )}
                  </AnimatePresence>

                </span>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div style={{ margin: '28px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#cce0cc' }} />
            <span style={{ fontSize: 12, color: '#96b09a', whiteSpace: 'nowrap' }}>Or continue with</span>
            <div style={{ flex: 1, height: 1, background: '#cce0cc' }} />
          </div>

          {/* Google */}
          <motion.button
            type="button"
            disabled={isLoading || isGuestLoading}
            onClick={handleGoogle}
            whileHover={{ scale: 1.012, y: -1.5 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            style={{
              width: '100%', height: 50, borderRadius: 12,
              background: '#fff',
              border: '1.5px solid #d0e8d0',
              color: '#1a2b1d', fontSize: 14, fontWeight: 500,
              cursor: (isLoading || isGuestLoading) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              opacity: (isLoading || isGuestLoading) ? 0.55 : 1,
              marginBottom: 14,
            }}
          >
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#888' }} />
              : <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            }
            Continue with Google
          </motion.button>

          {/* Guest */}
          <motion.button
            type="button"
            disabled={isLoading || isGuestLoading}
            onClick={handleGuest}
            whileHover={{ scale: 1.012, y: -1.5 }}
            whileTap={{ scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            style={{
              width: '100%', height: 50, borderRadius: 12,
              background: 'transparent',
              border: '1.5px dashed #b8d8b8',
              color: '#6b8f72', fontSize: 14, fontWeight: 500,
              cursor: (isLoading || isGuestLoading) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: (isLoading || isGuestLoading) ? 0.55 : 1,
            }}
          >
            {isGuestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCircle className="h-5 w-5 shrink-0" />}
            Continue as Guest
          </motion.button>

          <p style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#9aac9c' }}>
            Guest mode menggunakan penyimpanan lokal.{' '}
            <span style={{ color: '#b8ccba' }}>Data tidak tersimpan di server.</span>
          </p>

        </motion.div>
      </div>

      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center" style={{ background: '#f3fcee' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#4caf50' }} />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
