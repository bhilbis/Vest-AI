/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Activity,
  CreditCard,
  Plus,
  RefreshCw,
  Sparkles,
  BarChart3,
  Clock,
  Target,
  Loader2,
  ChevronRight,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { usePortfolioAssets } from "@/components/tracker/dashboard/usePortfolioAssets"
import type { AssetProps } from "@/components/tracker/dashboard/types"
import { formatCurrency, calculateExpenseSummary } from "@/lib/expenseUtils"
import Link from "next/link"

// ==================== TYPES ====================
interface AccountBalance {
  id: string
  name: string
  type: string
  balance: number
  createdAt: string
}

interface BudgetData {
  id: string
  name: string
  category: string | null
  limit: number
  spent: number
  remaining: number
}

interface ExpenseData {
  id: string
  title: string
  amount: number
  category: string | null
  date: string
  accountId?: string
}

interface TransferData {
  id: string
  amount: number
  type: string
  createdAt: string
  fromAccount: { name: string }
  toAccount: { name: string }
}

type MergedRecord = {
  type: "expense" | "transfer"
  id: string
  title: string
  amount: number
  category?: string
  date: string
}

// ==================== ANIMATION VARIANTS ====================
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

// ==================== COMPONENT ====================
export function UnifiedDashboard() {
  const { assets, loading: assetsLoading, reload: reloadAssets } = usePortfolioAssets()

  const [accounts, setAccounts] = useState<AccountBalance[]>([])
  const [budgets, setBudgets] = useState<BudgetData[]>([])
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [transfers, setTransfers] = useState<TransferData[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  }, [])

  const fetchFinancialData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [accRes, budRes, expRes, trfRes] = await Promise.all([
        fetch("/api/account-balance"),
        fetch(`/api/budgets?month=${currentMonth}`),
        fetch(`/api/expenses?month=${currentMonth}`),
        fetch(`/api/transfers?month=${currentMonth}`),
      ])

      const [accData, budData, expData, trfData] = await Promise.all([
        accRes.ok ? accRes.json() : [],
        budRes.ok ? budRes.json() : [],
        expRes.ok ? expRes.json() : [],
        trfRes.ok ? trfRes.json() : [],
      ])

      setAccounts(accData)
      setBudgets(Array.isArray(budData) ? budData : [])
      setExpenses(Array.isArray(expData) ? expData : [])
      setTransfers(Array.isArray(trfData) ? trfData : [])
    } catch (err) {
      console.error("Failed to fetch financial data:", err)
    } finally {
      setDataLoading(false)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchFinancialData()
  }, [fetchFinancialData])

  const handleReloadAll = useCallback(() => {
    reloadAssets()
    fetchFinancialData()
  }, [reloadAssets, fetchFinancialData])

  // ==================== COMPUTED VALUES ====================
  const totalAccountBalance = useMemo(
    () => accounts.reduce((sum, acc) => sum + acc.balance, 0),
    [accounts]
  )

  const portfolioStats = useMemo(() => {
    if (!assets.length) return { totalValue: 0, totalProfit: 0, profitPct: 0, topAssets: [], categories: [] }
    const totalValue = assets.reduce((sum, a) => sum + (a.value ?? a.lots * (a.currentPrice ?? 0)), 0)
    const totalCost = assets.reduce((sum, a) => sum + a.lots * (a.buyPrice ?? 0), 0)
    const totalProfit = totalValue - totalCost
    const profitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

    const sorted = [...assets].sort((a, b) => {
      const va = a.value ?? a.lots * (a.currentPrice ?? 0)
      const vb = b.value ?? b.lots * (b.currentPrice ?? 0)
      return vb - va
    })

    const catMap = assets.reduce((acc, a) => {
      const v = a.value ?? a.lots * (a.currentPrice ?? 0)
      acc[a.category] = (acc[a.category] || 0) + v
      return acc
    }, {} as Record<string, number>)

    const categories = Object.entries(catMap)
      .map(([name, value]) => ({ name, value, pct: totalValue > 0 ? (value / totalValue) * 100 : 0 }))
      .sort((a, b) => b.value - a.value)

    return { totalValue, totalProfit, profitPct, topAssets: sorted.slice(0, 5), categories }
  }, [assets])

  const expenseSummary = useMemo(() => calculateExpenseSummary(expenses), [expenses])

  const budgetTotals = useMemo(() => {
    const limit = budgets.reduce((s, b) => s + b.limit, 0)
    const spent = budgets.reduce((s, b) => s + (b.spent || 0), 0)
    return { limit, spent, pct: limit > 0 ? (spent / limit) * 100 : 0 }
  }, [budgets])

  const recentActivity: MergedRecord[] = useMemo(() => {
    const expRecords: MergedRecord[] = expenses.map((e) => ({
      type: "expense",
      id: e.id,
      title: e.title,
      amount: e.amount,
      category: e.category || "other",
      date: e.date,
    }))
    const trfRecords: MergedRecord[] = transfers.map((t) => ({
      type: "transfer",
      id: t.id,
      title: `${t.fromAccount.name} → ${t.toAccount.name}`,
      amount: t.amount,
      category: t.type,
      date: t.createdAt,
    }))
    return [...expRecords, ...trfRecords]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
  }, [expenses, transfers])

  const totalNetWorth = totalAccountBalance + portfolioStats.totalValue

  const isLoading = assetsLoading || dataLoading

  const monthLabel = useMemo(() => {
    const [y, m] = currentMonth.split("-").map(Number)
    return new Date(y, m - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
  }, [currentMonth])

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-[11px] text-muted-foreground ring-1 ring-border">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Dashboard • {monthLabel}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Overview</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Semua data keuangan dan investasi Anda dalam satu tampilan.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={handleReloadAll}>
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* ==================== BENTO GRID ==================== */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]"
      >
        {/* ── 1. Net Worth (Large) ── */}
        <motion.div variants={item} className="col-span-2 md:col-span-4 lg:col-span-5 row-span-2">
          <Card className="h-full relative overflow-hidden border-border/50 bg-card hover-lift">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            <div className="p-5 sm:p-6 flex flex-col justify-between h-full relative z-10">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Wallet className="h-4 w-4" />
                  <span>Total Net Worth</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight tabular-nums">
                  {isLoading ? (
                    <span className="animate-shimmer h-10 w-48 rounded block" />
                  ) : (
                    formatCurrency(totalNetWorth)
                  )}
                </h2>
                {!isLoading && (
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <CreditCard className="h-3 w-3" />
                      Cash: {formatCurrency(totalAccountBalance)}
                    </Badge>
                    <Badge variant="outline" className="gap-1 text-xs">
                      <BarChart3 className="h-3 w-3" />
                      Portfolio: {formatCurrency(portfolioStats.totalValue)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Mini allocation bar */}
              {!isLoading && totalNetWorth > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Cash vs Portfolio</span>
                    <span>{((totalAccountBalance / totalNetWorth) * 100).toFixed(0)}% / {((portfolioStats.totalValue / totalNetWorth) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted flex overflow-hidden">
                    <div
                      className="bg-chart-1 rounded-l-full transition-all duration-700"
                      style={{ width: `${(totalAccountBalance / totalNetWorth) * 100}%` }}
                    />
                    <div
                      className="bg-primary rounded-r-full transition-all duration-700"
                      style={{ width: `${(portfolioStats.totalValue / totalNetWorth) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── 2. Portfolio P/L ── */}
        <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-4 row-span-1">
          <Card className="h-full border-border/50 bg-card p-5 hover-lift">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span>Portfolio P/L</span>
            </div>
            {isLoading ? (
              <div className="animate-shimmer h-8 w-32 rounded" />
            ) : (
              <>
                <p className={`text-2xl font-bold tabular-nums ${portfolioStats.totalProfit >= 0 ? "text-chart-1" : "text-destructive"}`}>
                  {portfolioStats.totalProfit >= 0 ? "+" : ""}{formatCurrency(portfolioStats.totalProfit)}
                </p>
                <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${portfolioStats.totalProfit >= 0 ? "bg-chart-1/10 text-chart-1" : "bg-destructive/10 text-destructive"}`}>
                  {portfolioStats.totalProfit >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(portfolioStats.profitPct).toFixed(2)}%
                </div>
              </>
            )}
          </Card>
        </motion.div>

        {/* ── 3. Monthly Expenses ── */}
        <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1">
          <Card className="h-full border-border/50 bg-card p-5 hover-lift">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Activity className="h-4 w-4" />
              <span>Pengeluaran Bulan Ini</span>
            </div>
            {isLoading ? (
              <div className="animate-shimmer h-8 w-32 rounded" />
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums text-destructive">
                  {formatCurrency(expenseSummary.total)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {expenseSummary.count} transaksi • Rata-rata {formatCurrency(expenseSummary.average)}
                </p>
              </>
            )}
          </Card>
        </motion.div>

        {/* ── 4. Budget Progress ── */}
        <motion.div variants={item} className="col-span-2 md:col-span-2 lg:col-span-4 row-span-1">
          <Card className="h-full border-border/50 bg-card p-5 hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Budget Bulan Ini</span>
              </div>
              {!isLoading && budgets.length > 0 && (
                <span className={`text-xs font-semibold tabular-nums ${budgetTotals.pct > 90 ? "text-destructive" : budgetTotals.pct > 70 ? "text-chart-4" : "text-chart-1"}`}>
                  {budgetTotals.pct.toFixed(0)}%
                </span>
              )}
            </div>
            {isLoading ? (
              <div className="animate-shimmer h-8 w-full rounded" />
            ) : budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada budget</p>
            ) : (
              <div className="space-y-2">
                <Progress
                  value={Math.min(budgetTotals.pct, 100)}
                  className="h-2.5"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Terpakai: {formatCurrency(budgetTotals.spent)}</span>
                  <span>Limit: {formatCurrency(budgetTotals.limit)}</span>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* ── 5. Account Balances ── */}
        <motion.div variants={item} className="col-span-2 md:col-span-2 lg:col-span-3 row-span-2">
          <Card className="h-full border-border/50 bg-card flex flex-col">
            <div className="p-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                Akun Saldo
              </div>
              <Link href="/financial-overview" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Detail <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-shimmer h-14 rounded-lg" />
                ))
              ) : accounts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground py-8">
                  <CreditCard className="h-8 w-8 mb-2 opacity-20" />
                  <p>Belum ada akun</p>
                </div>
              ) : (
                accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {acc.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{acc.name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{acc.type}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-chart-1 shrink-0 ml-2">
                      {formatCurrency(acc.balance)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── 6. Top Investments ── */}
        <motion.div variants={item} className="col-span-2 md:col-span-2 lg:col-span-5 row-span-2">
          <Card className="h-full border-border/50 bg-card flex flex-col">
            <div className="p-5 pb-3 flex items-center justify-between border-b border-border/30">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Top Investments
              </h3>
              <Badge variant="outline" className="text-[10px]">
                {assets.length} aset
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/20">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="animate-shimmer h-10 rounded" />
                  </div>
                ))
              ) : portfolioStats.topAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground py-8">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-20" />
                  <p>Belum ada investasi</p>
                </div>
              ) : (
                portfolioStats.topAssets.map((asset: AssetProps) => {
                  const val = asset.value ?? asset.lots * (asset.currentPrice ?? 0)
                  const cost = asset.lots * (asset.buyPrice ?? 0)
                  const profit = val - cost
                  const pct = cost > 0 ? (profit / cost) * 100 : 0
                  const up = profit >= 0

                  return (
                    <div key={asset.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${asset.color || "bg-muted"} bg-opacity-15`}>
                          {asset.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{asset.name}</p>
                          <p className="text-[11px] text-muted-foreground">{asset.lots} Lots • {asset.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums">{formatCurrency(val)}</p>
                        <p className={`text-[11px] flex items-center justify-end gap-0.5 ${up ? "text-chart-1" : "text-destructive"}`}>
                          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(pct).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── 7. Asset Allocation ── */}
        <motion.div variants={item} className="col-span-2 md:col-span-2 lg:col-span-4 row-span-2">
          <Card className="h-full border-border/50 bg-card p-5 flex flex-col">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              Asset Allocation
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-shimmer h-12 rounded" />
                ))
              ) : portfolioStats.categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground py-8">
                  <PieChart className="h-8 w-8 mb-2 opacity-20" />
                  <p>Tidak ada data</p>
                </div>
              ) : (
                portfolioStats.categories.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-muted-foreground tabular-nums">{cat.pct.toFixed(1)}%</span>
                    </div>
                    <Progress value={cat.pct} className="h-1.5" />
                    <p className="text-[11px] text-muted-foreground text-right tabular-nums">{formatCurrency(cat.value)}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── 8. Budget Breakdown ── */}
        <motion.div variants={item} className="col-span-2 md:col-span-2 lg:col-span-4 row-span-2">
          <Card className="h-full border-border/50 bg-card flex flex-col">
            <div className="p-5 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                Budget Breakdown
              </h3>
              <Link href="/financial-overview" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Kelola <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-shimmer h-16 rounded-lg" />
                ))
              ) : budgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground py-8">
                  <Target className="h-8 w-8 mb-2 opacity-20" />
                  <p>Belum ada budget</p>
                  <Link href="/financial-overview">
                    <Button variant="outline" size="sm" className="mt-3 gap-1.5 text-xs">
                      <Plus className="h-3 w-3" /> Buat Budget
                    </Button>
                  </Link>
                </div>
              ) : (
                budgets.map((budget) => {
                  const usage = budget.limit > 0 ? Math.min((budget.spent / budget.limit) * 100, 100) : 0
                  const color = usage > 90 ? "text-destructive" : usage > 70 ? "text-chart-4" : "text-chart-1"

                  return (
                    <div key={budget.id} className="rounded-lg bg-muted/30 p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">{budget.name}</p>
                          {budget.category && (
                            <p className="text-[11px] text-muted-foreground capitalize">{budget.category}</p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold tabular-nums ${color}`}>{usage.toFixed(0)}%</span>
                      </div>
                      <Progress value={usage} className="h-1.5" />
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{formatCurrency(budget.spent)}</span>
                        <span>{formatCurrency(budget.limit)}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── 9. Recent Activity ── */}
        <motion.div variants={item} className="col-span-2 md:col-span-4 lg:col-span-4 row-span-2">
          <Card className="h-full border-border/50 bg-card flex flex-col">
            <div className="p-5 pb-3 flex items-center justify-between border-b border-border/30">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Aktivitas Terbaru
              </h3>
              <Link href="/financial-overview" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Semua <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/20">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="animate-shimmer h-10 rounded" />
                  </div>
                ))
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground py-8">
                  <Activity className="h-8 w-8 mb-2 opacity-20" />
                  <p>Belum ada aktivitas</p>
                </div>
              ) : (
                recentActivity.map((record) => {
                  const isTransfer = record.type === "transfer"
                  return (
                    <div key={record.id + record.type} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isTransfer ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                        {isTransfer ? <ArrowLeftRight className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{record.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(record.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                          {record.category && ` • ${record.category}`}
                        </p>
                      </div>
                      <p className={`text-sm font-semibold tabular-nums shrink-0 ${isTransfer ? "text-primary" : "text-destructive"}`}>
                        {isTransfer ? "" : "−"}{formatCurrency(record.amount)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── 10. Quick Actions ── */}
        <motion.div variants={item} className="col-span-2 md:col-span-4 lg:col-span-12 row-span-1">
          <Card className="border-border/50 bg-card p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Kelola Keuangan</h3>
                  <p className="text-xs text-muted-foreground">Akses cepat ke fitur utama</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/financial-overview">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Tambah Pengeluaran
                  </Button>
                </Link>
                <Link href="/financial-overview">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Transfer
                  </Button>
                </Link>
                <Link href="/financial-overview">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Target className="h-3.5 w-3.5" /> Set Budget
                  </Button>
                </Link>
                <Link href="/tracker/messages">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Sparkles className="h-3.5 w-3.5" /> AI Chat
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-muted-foreground">Memuat data...</span>
          </div>
        </div>
      )}
    </div>
  )
}
