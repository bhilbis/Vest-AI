"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import { motion } from "motion/react"
import {
  ArrowUpRight, ArrowDownRight, ArrowLeftRight,
  Target, GraduationCap, TrendingUp, TrendingDown,
  Wallet, Plus, ChevronRight, BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/expenseUtils"
import { useGuestStore } from "@/lib/guest-store"
import { useLanguage } from "@/lib/i18n/context"

/* ─── helpers ─── */
const getMonthKey = () => new Date().toISOString().slice(0, 7)

const fmtShort = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(Math.round(n))
}

/* ─── animated counter ─── */
function Counter({ to, prefix = "Rp ", duration = 900 }: { to: number; prefix?: string; duration?: number }) {
  const [val, setVal] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * ease))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [to, duration])
  return <span>{prefix}{fmtShort(val)}</span>
}

/* ─── SVG sparkline ─── */
function Sparkline({ values, color, height = 32, width = 80 }: { values: number[]; color: string; height?: number; width?: number }) {
  if (values.length < 2) return null
  const max = Math.max(...values) || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - (v / max) * (height - 4)
    return `${x},${y}`
  }).join(" ")
  const areaPath = `M 0,${height} L ${pts.split(" ").map(p => p).join(" L ")} L ${width},${height} Z`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace(/[^a-z]/gi, "")})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── SVG donut ring ─── */
function DonutRing({ pct, size = 80, stroke = 8, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(pct / 100, 1) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-border" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  )
}

/* ─── types ─── */
interface Account { id: string; balance: number; name: string; type: string }
interface Expense { id: string; amount: number; title: string; category: string; date: string }
interface Income { id: string; amount: number; title: string; date: string }
interface Transfer { id: string; amount: number; date: string; fromAccount?: { name: string }; toAccount?: { name: string } }
interface Budget { id: string; limit: number; spent: number; category?: string }
interface Semester { id: string; name: string; gpa?: number; mataKuliah?: { id: string }[] }
interface Asset { id: string; amount?: number | null; buyPrice?: number | null }

type Activity =
  | { type: "expense"; id: string; title: string; amount: number; date: string; category: string }
  | { type: "income"; id: string; title: string; amount: number; date: string }
  | { type: "transfer"; id: string; title: string; amount: number; date: string }

/* ════════════════════════════════════════════════ PAGE ═══════════════════════════════════════════ */
export default function DashboardPage() {
  const { data: session } = useSession()
  const { isGuest, guestName } = useGuestStore()
  const { t, dateLocale } = useLanguage()
  const isMobile = useIsMobile()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [ready, setReady] = useState(false)

  const monthKey = useMemo(() => getMonthKey(), [])
  const displayName = isGuest ? guestName : (session?.user?.name?.split(" ")[0] ?? "")

  const greetingByHour = () => {
    const h = new Date().getHours()
    if (h < 11) return t.dashboard.greeting.morning
    if (h < 15) return t.dashboard.greeting.afternoon
    if (h < 18) return t.dashboard.greeting.evening
    return t.dashboard.greeting.night
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(dateLocale, { day: "numeric", month: "short" })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isGuest) { setReady(true); return }
    Promise.allSettled([
      fetch("/api/account-balance").then(r => r.ok ? r.json() : []),
      fetch(`/api/expenses?month=${monthKey}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/income?month=${monthKey}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/transfers?month=${monthKey}`).then(r => r.ok ? r.json() : []),
      fetch(`/api/budgets?month=${monthKey}`).then(r => r.ok ? r.json() : { budgets: [] }),
      fetch("/api/kuliah/semester").then(r => r.ok ? r.json() : []),
      fetch("/api/assets").then(r => r.ok ? r.json() : []),
    ]).then(([acc, exp, inc, trf, bud, sem, ast]) => {
      if (acc.status === "fulfilled") setAccounts(acc.value ?? [])
      if (exp.status === "fulfilled") setExpenses(exp.value ?? [])
      if (inc.status === "fulfilled") setIncomes(inc.value ?? [])
      if (trf.status === "fulfilled") setTransfers(trf.value ?? [])
      if (bud.status === "fulfilled") setBudgets(bud.value?.budgets ?? bud.value ?? [])
      if (sem.status === "fulfilled") setSemesters(sem.value ?? [])
      if (ast.status === "fulfilled") setAssets(ast.value ?? [])
    }).finally(() => setReady(true))
  }, [monthKey, isGuest])

  /* ─── derived ─── */
  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts])
  const totalPortfolio = useMemo(() => assets.reduce((s, a) => s + (Number(a.amount) || 0) * (Number(a.buyPrice) || 0), 0), [assets])
  const totalNetWorth = totalBalance + totalPortfolio
  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes])
  const totalExpense = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])
  const netFlow = totalIncome - totalExpense

  const budgetTotals = useMemo(
    () => budgets.reduce((a, b) => ({ limit: a.limit + (b.limit || 0), spent: a.spent + (Number(b.spent) || 0) }), { limit: 0, spent: 0 }),
    [budgets]
  )
  const budgetPct = budgetTotals.limit > 0 ? Math.min((budgetTotals.spent / budgetTotals.limit) * 100, 100) : 0

  const latestSemester = useMemo(() => semesters[0] ?? null, [semesters])
  const totalCourses = useMemo(() => semesters.reduce((s, sem) => s + (sem.mataKuliah?.length ?? 0), 0), [semesters])

  const expSparkline = useMemo(() => {
    const days: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      days[d.toISOString().slice(0, 10)] = 0
    }
    expenses.forEach(e => { const k = e.date.slice(0, 10); if (k in days) days[k] += e.amount })
    return Object.values(days)
  }, [expenses])

  const incSparkline = useMemo(() => {
    const days: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      days[d.toISOString().slice(0, 10)] = 0
    }
    incomes.forEach(i => { const k = i.date.slice(0, 10); if (k in days) days[k] += i.amount })
    return Object.values(days)
  }, [incomes])

  const activity = useMemo<Activity[]>(() => {
    const all: Activity[] = [
      ...expenses.map(e => ({ type: "expense" as const, id: e.id, title: e.title, amount: e.amount, date: e.date, category: e.category })),
      ...incomes.map(i => ({ type: "income" as const, id: i.id, title: i.title, amount: i.amount, date: i.date })),
      ...transfers.map(tr => ({
        type: "transfer" as const, id: tr.id,
        title: `${tr.fromAccount?.name ?? "?"} → ${tr.toAccount?.name ?? "?"}`,
        amount: tr.amount, date: tr.date,
      })),
    ]
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)
  }, [expenses, incomes, transfers])

  const budgetColor =
    budgetPct >= 90 ? "hsl(var(--destructive))"
    : budgetPct >= 70 ? "#f59e0b"
    : "hsl(var(--primary))"

  /* ─── loading skeleton ─── */
  if (!ready) {
    return (
      <div className="h-[calc(100svh-3.5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
          <p className="text-xs text-muted-foreground">{t.common.loadingDashboard}</p>
        </div>
      </div>
    )
  }

  /* ════════════ RENDER ════════════ */
  return (
    <div
      className={isMobile ? "flex flex-col" : "flex flex-col overflow-hidden"}
      style={isMobile ? undefined : { height: "calc(100svh - 0px)" }}
    >
      {/* ── Header bar ── */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-border bg-background/80 backdrop-blur-sm">
        <div>
          <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">
            {new Date().toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-lg font-bold text-foreground leading-tight">
            {greetingByHour()}{displayName ? `, ${displayName}` : ""}
          </h1>
        </div>
        <Button asChild size="sm">
          <Link href="/financial-overview">
            <Plus size={13} /> {t.common.add}
          </Link>
        </Button>
      </div>

      {/* ── Bento grid ── */}
      <div
        className={isMobile ? "p-3 gap-3 overflow-y-auto" : "flex-1 min-h-0 p-3 gap-3"}
        style={
          isMobile
            ? {
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridTemplateAreas: `
                  "balance  balance"
                  "income   expense"
                  "budget   budget"
                  "txns     txns"
                  "academic academic"
                `,
              }
            : {
                display: "grid",
                gridTemplateColumns: "1.15fr 1fr 1fr",
                gridTemplateRows: "1fr 1fr 0.9fr",
                gridTemplateAreas: `
                  "balance income  budget"
                  "balance expense budget"
                  "txns    txns    academic"
                `,
              }
        }
      >

        {/* ══ A: BALANCE HERO ══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ gridArea: "balance" }}
          className="relative rounded-2xl overflow-hidden flex flex-col justify-between p-5 border border-border"
        >
          <div className="absolute inset-0 bg-primary/8 pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 70% at 10% 110%, hsl(var(--primary)/0.18) 0%, transparent 65%)" }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                <Wallet size={14} className="text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.dashboard.netWorth}</span>
            </div>

            <div className="mb-1">
              <span className="text-[11px] text-muted-foreground">Rp </span>
              <span className="text-3xl font-black text-foreground tracking-tight leading-none">
                {ready ? <Counter to={totalNetWorth} prefix="" /> : "—"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">
              {t.dashboard.financePortfolio} · {new Date().toLocaleDateString(dateLocale, { month: "long", year: "numeric" })}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {accounts.slice(0, 3).map(acc => (
                <div key={acc.id} className="flex items-center gap-1 bg-muted/80 rounded-full px-2 py-0.5">
                  <span className="text-[9px]">{acc.type === "cash" ? "💵" : acc.type === "bank" ? "🏦" : "📱"}</span>
                  <span className="text-[10px] font-medium text-foreground">{acc.name}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] font-semibold text-foreground">{fmtShort(acc.balance)}</span>
                </div>
              ))}
              {totalPortfolio > 0 && (
                <div className="flex items-center gap-1 bg-muted/80 rounded-full px-2 py-0.5">
                  <span className="text-[9px]">📈</span>
                  <span className="text-[10px] font-medium text-foreground">{t.dashboard.portfolio}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] font-semibold text-foreground">{fmtShort(totalPortfolio)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground font-medium">{t.dashboard.netThisMonth}</span>
              <span className={cn("text-xs font-bold flex items-center gap-0.5", netFlow >= 0 ? "text-success" : "text-destructive")}>
                {netFlow >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {netFlow >= 0 ? "+" : ""}{formatCurrency(Math.abs(netFlow))}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totalIncome + totalExpense > 0 ? (totalIncome / (totalIncome + totalExpense)) * 100 : 0}%` }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-success">↑ {t.dashboard.incoming}</span>
              <span className="text-[9px] text-destructive">↓ {t.dashboard.outgoing}</span>
            </div>
          </div>
        </motion.div>

        {/* ══ B: INCOME ══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
          style={{ gridArea: "income" }}
          className="rounded-2xl border border-border bg-card p-3 sm:p-4 flex flex-col justify-between overflow-hidden min-h-[120px]"
        >
          <div className="flex items-start justify-between">
            <div className="h-7 w-7 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <ArrowUpRight size={14} className="text-success" />
            </div>
            <Sparkline values={incSparkline} color="hsl(var(--success))" height={28} width={60} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">{t.dashboard.income}</p>
            <p className="text-xl font-black text-foreground leading-tight">
              <Counter to={totalIncome} />
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{incomes.length} {t.dashboard.transactionsThisMonth}</p>
          </div>
        </motion.div>

        {/* ══ C: EXPENSE ══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          style={{ gridArea: "expense" }}
          className="rounded-2xl border border-border bg-card p-3 sm:p-4 flex flex-col justify-between overflow-hidden min-h-[120px]"
        >
          <div className="flex items-start justify-between">
            <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <ArrowDownRight size={14} className="text-destructive" />
            </div>
            <Sparkline values={expSparkline} color="hsl(var(--destructive))" height={28} width={60} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-0.5">{t.dashboard.expenses}</p>
            <p className="text-xl font-black text-foreground leading-tight">
              <Counter to={totalExpense} />
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{expenses.length} {t.dashboard.transactionsThisMonth}</p>
          </div>
        </motion.div>

        {/* ══ D: BUDGET RING ══ */}
        <motion.div
          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ gridArea: "budget" }}
          className="rounded-2xl border border-border bg-card p-4 flex flex-col items-center justify-center gap-3 overflow-hidden"
        >
          <div className="flex items-center gap-2 self-start w-full">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Target size={14} className="text-primary" />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.dashboard.budget}</span>
            <Link href="/financial-overview/budgets" className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight size={13} />
            </Link>
          </div>

          {budgetTotals.limit > 0 ? (
            <>
              <div className="relative flex items-center justify-center">
                <DonutRing pct={budgetPct} size={96} stroke={9} color={budgetColor} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-foreground leading-none">{Math.round(budgetPct)}%</span>
                  <span className="text-[9px] text-muted-foreground">{t.dashboard.used}</span>
                </div>
              </div>
              <div className="w-full space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">{t.dashboard.usedLabel}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(budgetTotals.spent)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">{t.dashboard.remaining}</span>
                  <span className={cn("font-semibold", budgetPct >= 90 ? "text-destructive" : "text-success")}>
                    {formatCurrency(Math.max(budgetTotals.limit - budgetTotals.spent, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">{budgets.length} {t.financial.categories}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(budgetTotals.limit)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Target size={20} className="text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{t.dashboard.noBudget}</p>
              <Link href="/financial-overview/budgets">
                <span className="text-[11px] text-primary font-medium hover:underline">{t.dashboard.createBudget}</span>
              </Link>
            </div>
          )}
        </motion.div>

        {/* ══ E: RECENT ACTIVITY ══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{ gridArea: "txns" }}
          className="rounded-2xl border border-border bg-card p-4 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.dashboard.recentActivity}</span>
            <Link href="/financial-overview/transactions" className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-medium">
              {t.dashboard.viewAll} <ChevronRight size={11} />
            </Link>
          </div>

          {activity.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
              <ArrowLeftRight size={18} className="text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">{t.dashboard.noTransactions}</p>
            </div>
          ) : (
            <div
              className="flex-1 overflow-hidden grid gap-1.5"
              style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", alignContent: "start" }}
            >
              {activity.map((tx) => {
                const isInc = tx.type === "income"
                const isTrf = tx.type === "transfer"
                return (
                  <div key={tx.id} className="flex items-center gap-2 py-1 min-w-0">
                    <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
                      isInc ? "bg-success/10" : isTrf ? "bg-chart-2/10" : "bg-destructive/10"
                    )}>
                      {isInc
                        ? <ArrowUpRight size={12} className="text-success" />
                        : isTrf
                        ? <ArrowLeftRight size={12} className="text-chart-2" />
                        : <ArrowDownRight size={12} className="text-destructive" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-foreground truncate leading-tight">{tx.title}</p>
                      <p className="text-[9px] text-muted-foreground leading-tight">{fmtDate(tx.date)}</p>
                    </div>
                    <span className={cn("text-[11px] font-bold shrink-0",
                      isInc ? "text-success" : isTrf ? "text-chart-2" : "text-destructive"
                    )}>
                      {isInc ? "+" : isTrf ? "" : "-"}{fmtShort(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* ══ F: ACADEMIC ══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{ gridArea: "academic" }}
          className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between overflow-hidden"
        >
          <div className="flex items-center justify-between shrink-0 mb-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
                <GraduationCap size={14} className="text-chart-2" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t.dashboard.academic}</span>
            </div>
            <Link href="/kuliah/tracker" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronRight size={13} />
            </Link>
          </div>

          {semesters.length > 0 ? (
            <div className="flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-black text-foreground leading-none">
                    {latestSemester?.gpa != null ? latestSemester.gpa.toFixed(2) : "—"}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{t.dashboard.latestGPA}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-black text-foreground leading-none">{semesters.length}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{t.dashboard.semester}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <BookOpen size={11} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{totalCourses} {t.dashboard.totalCourses}</span>
                </div>
                {latestSemester && (
                  <span className="text-[10px] font-medium text-primary truncate max-w-[100px]">
                    {latestSemester.name}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-1.5 text-center">
              <GraduationCap size={18} className="text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">{t.dashboard.noAcademicData}</p>
              <Link href="/kuliah/tracker">
                <span className="text-[11px] text-primary font-medium hover:underline">{t.dashboard.startTracker}</span>
              </Link>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  )
}
