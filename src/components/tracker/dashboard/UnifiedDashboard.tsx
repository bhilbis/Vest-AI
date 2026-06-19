"use client"

import { useCallback, useMemo } from "react"
import { motion } from "motion/react"
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Plus,
  RefreshCw,
  Star,
  Layers,
  Loader2,
  ExternalLink,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { usePortfolioAssets } from "@/components/tracker/dashboard/usePortfolioAssets"
import type { AssetProps } from "@/components/tracker/dashboard/types"
import { formatCurrency } from "@/lib/expenseUtils"
import Link from "next/link"

type AssetWithStats = AssetProps & {
  val: number
  cost: number
  profit: number
  pct: number
}

// ==================== ANIMATION VARIANTS ====================
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
}

// ==================== COMPONENT ====================
export function UnifiedDashboard() {
  const { assets, loading: assetsLoading, reload: reloadAssets } = usePortfolioAssets()

  const handleReloadAll = useCallback(() => {
    reloadAssets()
  }, [reloadAssets])

  const isLoading = assetsLoading

  const portfolio = useMemo(() => {
    if (!assets.length) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitPct: 0,
        bestPerformer: null as AssetWithStats | null,
        worstPerformer: null as AssetWithStats | null,
        categories: [] as { name: string; value: number; pct: number }[],
        allSorted: [] as AssetWithStats[],
      }
    }

    const withStats: AssetWithStats[] = assets.map((a) => {
      const val = a.value ?? a.lots * (a.currentPrice ?? 0)
      const cost = a.lots * (a.buyPrice ?? 0)
      const profit = val - cost
      const pct = cost > 0 ? (profit / cost) * 100 : 0
      return { ...a, val, cost, profit, pct }
    })

    const totalValue = withStats.reduce((s, a) => s + a.val, 0)
    const totalCost = withStats.reduce((s, a) => s + a.cost, 0)
    const totalProfit = totalValue - totalCost
    const profitPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0

    const allSorted = [...withStats].sort((a, b) => b.val - a.val)
    const byPct = [...withStats].sort((a, b) => b.pct - a.pct)

    const catMap = withStats.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + a.val
      return acc
    }, {} as Record<string, number>)

    const categories = Object.entries(catMap)
      .map(([name, value]) => ({ name, value, pct: totalValue > 0 ? (value / totalValue) * 100 : 0 }))
      .sort((a, b) => b.value - a.value)

    return {
      totalValue,
      totalCost,
      totalProfit,
      profitPct,
      bestPerformer: byPct[0] ?? null,
      worstPerformer: byPct[byPct.length - 1] ?? null,
      categories,
      allSorted,
    }
  }, [assets])

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-[11px] text-muted-foreground ring-1 ring-border">
            <BarChart3 className="h-3 w-3 text-primary" />
            <span>Portfolio Tracker</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">Investasi Saya</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Pantau portofolio crypto, saham, dan aset investasi Anda secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleReloadAll} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/tracker/assets" className="flex items-center">
            <Button size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" /> Tambah Aset
            </Button>
          </Link>
        </div>
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
                  <BarChart3 className="h-4 w-4" />
                  <span>Total Nilai Portofolio</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight tabular-nums">
                  {isLoading ? (
                    <span className="animate-shimmer h-10 w-48 rounded block" />
                  ) : (
                    formatCurrency(portfolio.totalValue)
                  )}
                </h2>
                {!isLoading && (
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <BarChart3 className="h-3 w-3" />
                      {assets.length} aset investasi
                    </Badge>
                  </div>
                )}
              </div>
              {!isLoading && portfolio.totalValue > 0 && portfolio.totalCost > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Modal vs Profit</span>
                    <span>
                      {((portfolio.totalCost / portfolio.totalValue) * 100).toFixed(0)}% /{" "}
                      {((portfolio.totalProfit / portfolio.totalValue) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted flex overflow-hidden">
                    <div
                      className="bg-chart-1 rounded-l-full transition-all duration-700"
                      style={{ width: `${Math.min((portfolio.totalCost / portfolio.totalValue) * 100, 100)}%` }}
                    />
                    <div
                      className="bg-primary rounded-r-full transition-all duration-700"
                      style={{ width: `${Math.max((portfolio.totalProfit / portfolio.totalValue) * 100, 0)}%` }}
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
              <span>Total Profit / Loss</span>
            </div>
            {isLoading ? (
              <div className="animate-shimmer h-8 w-32 rounded" />
            ) : (
              <>
                <p className={`text-2xl font-bold tabular-nums ${portfolio.totalProfit >= 0 ? "text-chart-1" : "text-destructive"}`}>
                  {portfolio.totalProfit >= 0 ? "+" : ""}{formatCurrency(portfolio.totalProfit)}
                </p>
                <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${portfolio.totalProfit >= 0 ? "bg-chart-1/10 text-chart-1" : "bg-destructive/10 text-destructive"}`}>
                  {portfolio.totalProfit >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(portfolio.profitPct).toFixed(2)}%
                </div>
              </>
            )}
          </Card>
        </motion.div>

        {/* ── 3. Total Aset ── */}
        <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1">
          <Card className="h-full border-border/50 bg-card p-5 hover-lift">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Layers className="h-4 w-4" />
              <span>Total Aset</span>
            </div>
            {isLoading ? (
              <div className="animate-shimmer h-8 w-16 rounded" />
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums">{assets.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {portfolio.categories.length} kategori
                </p>
              </>
            )}
          </Card>
        </motion.div>

        {/* ── 4. Best Performer ── */}
        <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-4 row-span-1">
          <Card className="h-full border-border/50 bg-card p-5 hover-lift">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Star className="h-4 w-4" />
              <span>Best Performer</span>
            </div>
            {isLoading ? (
              <div className="animate-shimmer h-8 w-32 rounded" />
            ) : !portfolio.bestPerformer ? (
              <p className="text-sm text-muted-foreground">Belum ada aset</p>
            ) : (
              <>
                <p className="text-base font-bold truncate">{portfolio.bestPerformer.name}</p>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-chart-1/10 text-chart-1">
                  <ArrowUpRight className="h-3 w-3" />
                  {portfolio.bestPerformer.pct >= 0 ? "+" : ""}{portfolio.bestPerformer.pct.toFixed(2)}%
                </div>
              </>
            )}
          </Card>
        </motion.div>

        {/* ── 5. Worst Performer ── */}
        <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-3 row-span-1">
          <Card className="h-full border-border/50 bg-card p-5 hover-lift">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingDown className="h-4 w-4" />
              <span>Worst Performer</span>
            </div>
            {isLoading ? (
              <div className="animate-shimmer h-8 w-32 rounded" />
            ) : !portfolio.worstPerformer ? (
              <p className="text-sm text-muted-foreground">Belum ada aset</p>
            ) : (
              <>
                <p className="text-base font-bold truncate">{portfolio.worstPerformer.name}</p>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                  <ArrowDownRight className="h-3 w-3" />
                  {portfolio.worstPerformer.pct.toFixed(2)}%
                </div>
              </>
            )}
          </Card>
        </motion.div>

        {/* ── 6. Semua Holdings ── */}
        <motion.div variants={item} className="col-span-2 md:col-span-2 lg:col-span-7 row-span-3">
          <Card className="h-full border-border/50 bg-card flex flex-col">
            <div className="p-5 pb-3 flex items-center justify-between border-b border-border/30">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Semua Holdings
              </h3>
              <Link href="/tracker/assets">
                <Badge variant="outline" className="text-[10px] hover:bg-muted cursor-pointer gap-1">
                  {assets.length} aset <ExternalLink className="h-2.5 w-2.5" />
                </Badge>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/20">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="animate-shimmer h-10 rounded" />
                  </div>
                ))
              ) : portfolio.allSorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground py-8">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-20" />
                  <p>Belum ada investasi</p>
                  <Link href="/tracker/assets">
                    <Button variant="outline" size="sm" className="mt-3 gap-1.5 text-xs">
                      <Plus className="h-3 w-3" /> Tambah Aset
                    </Button>
                  </Link>
                </div>
              ) : (
                portfolio.allSorted.map((asset) => {
                  const up = asset.profit >= 0
                  return (
                    <div key={asset.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                          {asset.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{asset.name}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">
                            {asset.lots} lots · {asset.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">{formatCurrency(asset.val)}</p>
                        <p className={`text-[11px] flex items-center justify-end gap-0.5 ${up ? "text-chart-1" : "text-destructive"}`}>
                          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {up ? "+" : ""}{formatCurrency(asset.profit)} ({Math.abs(asset.pct).toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── 7. Alokasi Aset + Kas ── */}
        <motion.div variants={item} className="col-span-2 md:col-span-2 lg:col-span-5 row-span-3">
          <Card className="h-full border-border/50 bg-card flex flex-col">
            <div className="p-5 pb-3 border-b border-border/30">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                Alokasi Aset
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-shimmer h-12 rounded" />
                ))
              ) : portfolio.categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground py-8">
                  <PieChart className="h-8 w-8 mb-2 opacity-20" />
                  <p>Tidak ada data</p>
                </div>
              ) : (
                portfolio.categories.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{cat.name}</span>
                      <span className="text-muted-foreground tabular-nums">{cat.pct.toFixed(1)}%</span>
                    </div>
                    <Progress value={cat.pct} className="h-2" />
                    <p className="text-[11px] text-muted-foreground text-right tabular-nums">
                      {formatCurrency(cat.value)}
                    </p>
                  </div>
                ))
              )}
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
