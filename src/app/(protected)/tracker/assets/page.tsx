"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "motion/react"
import {
  Plus, RefreshCw, Search, TrendingUp, TrendingDown,
  BarChart3, ArrowUpRight, ArrowDownRight,
  Pencil, Trash2, Loader2, AlertCircle, Wallet,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command, CommandEmpty, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { usePortfolioAssets } from "@/components/tracker/dashboard/usePortfolioAssets"
import type { AssetProps } from "@/components/tracker/dashboard/types"
import { formatCurrency } from "@/lib/expenseUtils"
import { useDebounce } from "use-debounce"
import Image from "next/image"
import { useLanguage } from "@/lib/i18n/context"

// ── Types ──────────────────────────────────────────────

type AssetRow = AssetProps & {
  val: number
  cost: number
  profit: number
  pct: number
}

type Coin = { id: string; name: string; symbol: string; thumb: string }

interface FormState {
  name: string
  amount: string
  buyPrice: string
  currentPrice: string
  type: string
  category: string
  coinId: string
}

const EMPTY_FORM: FormState = {
  name: "", amount: "", buyPrice: "", currentPrice: "",
  type: "crypto", category: "cryptocurrency", coinId: "",
}

// ── Category helpers ───────────────────────────────────

type CatConfig = { label: string; pill: string; gradient: string }

const CAT_MAP: Record<string, CatConfig> = {
  cryptocurrency: {
    label: "Crypto",
    pill: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    gradient: "from-amber-400 to-orange-500",
  },
  stocks: {
    label: "Saham",
    pill: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    gradient: "from-blue-400 to-indigo-500",
  },
  "reksa dana": {
    label: "Reksa Dana",
    pill: "bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400",
    gradient: "from-teal-400 to-emerald-500",
  },
  bonds: {
    label: "Obligasi",
    pill: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
    gradient: "from-green-400 to-emerald-500",
  },
  etf: {
    label: "ETF",
    pill: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
    gradient: "from-purple-400 to-violet-500",
  },
  gold: {
    label: "Emas",
    pill: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",
    gradient: "from-yellow-400 to-amber-500",
  },
}

function catCfg(category: string): CatConfig {
  return (
    CAT_MAP[category?.toLowerCase()] ?? {
      label: category || "Lainnya",
      pill: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400",
      gradient: "from-slate-400 to-slate-500",
    }
  )
}

// ── CoinGecko live search ──────────────────────────────

function useCoinSearch() {
  const [query, setQuery] = useState("")
  const [debouncedQuery] = useDebounce(query, 400)
  // Track which query the fetched coins belong to so loading can be derived
  const [fetchedFor, setFetchedFor] = useState("")
  const [fetchedCoins, setFetchedCoins] = useState<Coin[]>([])

  const trimmed = debouncedQuery.trim()
  // Derive: empty when no query; loading when query differs from last completed fetch
  const coins = trimmed ? fetchedCoins : []
  const loading = trimmed !== "" && trimmed !== fetchedFor

  useEffect(() => {
    const q = debouncedQuery.trim()
    if (!q) return
    const controller = new AbortController()
    fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`, {
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(data => {
        setFetchedFor(q)
        setFetchedCoins(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.coins ?? []).slice(0, 12).map((c: any) => ({
            id: c.id, name: c.name, symbol: c.symbol, thumb: c.thumb,
          }))
        )
      })
      .catch(err => {
        if (err?.name !== "AbortError") {
          setFetchedFor(q)
          setFetchedCoins([])
        }
      })
    return () => controller.abort()
  }, [debouncedQuery])

  return { query, setQuery, coins, loading }
}

// ── Stat mini-card ──────────────────────────────────────

function Stat({
  icon: Icon, label, value, sub, up,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  up?: boolean
}) {
  return (
    <Card className="p-4 sm:p-5 border-border/50 bg-card flex flex-col gap-1 hover-lift">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`text-lg sm:text-xl font-bold tabular-nums leading-tight ${
        up === true ? "text-chart-1" : up === false ? "text-destructive" : "text-foreground"
      }`}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </Card>
  )
}

// ── Form content (shared add / edit) ───────────────────

function AssetForm({
  form, setForm, isEdit, coinSearch, coinOpen, setCoinOpen, selectedCoin, setSelectedCoin,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  isEdit: boolean
  coinSearch: ReturnType<typeof useCoinSearch>
  coinOpen: boolean
  setCoinOpen: (v: boolean) => void
  selectedCoin: Coin | null
  setSelectedCoin: (c: Coin | null) => void
}) {
  const { t } = useLanguage()
  const totalCost = parseFloat(form.amount || "0") * parseFloat(form.buyPrice || "0")
  const totalVal = parseFloat(form.amount || "0") * parseFloat(form.currentPrice || "0")
  const hasCurr = parseFloat(form.currentPrice) > 0 && parseFloat(form.amount) > 0
  const pl = totalVal - totalCost
  const plPct = totalCost > 0 ? (pl / totalCost) * 100 : 0

  return (
    <div className="space-y-4 pt-1">
      {/* Asset type (only on add) */}
      {!isEdit && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t.tracker.assetTypeLabel}</Label>
          <Select
            value={form.type}
            onValueChange={v =>
              setForm(f => ({
                ...f, type: v,
                category: v === "crypto" ? "cryptocurrency" : f.category,
              }))
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="crypto">{t.tracker.cryptoType}</SelectItem>
              <SelectItem value="stock">{t.tracker.stockType}</SelectItem>
              <SelectItem value="manual">{t.tracker.otherType}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Coin picker (crypto + new only) */}
      {form.type === "crypto" && !isEdit && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t.tracker.coinLabel}</Label>
          <Popover open={coinOpen} onOpenChange={setCoinOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start h-9 font-normal text-sm">
                {selectedCoin ? (
                  <span className="flex items-center gap-2">
                    <Image src={selectedCoin.thumb} alt={selectedCoin.symbol} width={16} height={16} className="rounded-full" />
                    {selectedCoin.name}
                    <span className="text-muted-foreground text-xs ml-auto">{selectedCoin.symbol.toUpperCase()}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t.tracker.searchCoinPlaceholder}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-72" align="start">
              <Command>
                <CommandInput
                  value={coinSearch.query}
                  onValueChange={coinSearch.setQuery}
                  placeholder={t.tracker.coinTickerPlaceholder}
                />
                <CommandList className="max-h-56">
                  {coinSearch.loading && (
                    <div className="py-3 flex justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <CommandEmpty>{t.tracker.coinNotFound}</CommandEmpty>
                  {coinSearch.coins.map(coin => (
                    <CommandItem
                      key={coin.id}
                      value={coin.id}
                      onSelect={() => {
                        setSelectedCoin(coin)
                        setForm(f => ({
                          ...f,
                          name: `${coin.name} (${coin.symbol.toUpperCase()})`,
                          coinId: coin.id,
                          category: "cryptocurrency",
                        }))
                        setCoinOpen(false)
                      }}
                      className="flex items-center gap-2.5 cursor-pointer"
                    >
                      <Image src={coin.thumb} alt={coin.symbol} width={20} height={20} className="rounded-full shrink-0" />
                      <span className="flex-1 truncate">{coin.name}</span>
                      <span className="text-muted-foreground text-xs shrink-0">{coin.symbol.toUpperCase()}</span>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Manual name */}
      {(form.type !== "crypto" || isEdit) && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t.tracker.assetNameLabel}</Label>
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder={t.tracker.assetNamePlaceholder}
            className="h-9"
          />
        </div>
      )}

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t.financial.labelCategory}</Label>
        <Input
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          placeholder={t.tracker.categoryPlaceholder}
          className="h-9"
          disabled={form.type === "crypto" && !isEdit}
        />
      </div>

      {/* Lots + Buy Price */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t.tracker.amountLotsLabel}</Label>
          <Input
            type="number"
            step="any"
            min="0"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            placeholder="1.5"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t.tracker.buyPriceHeader}</Label>
          <Input
            type="number"
            step="any"
            min="0"
            value={form.buyPrice}
            onChange={e => setForm(f => ({ ...f, buyPrice: e.target.value }))}
            placeholder="1000000"
            className="h-9"
          />
        </div>
      </div>

      {/* Manual current price (non-crypto or edit) */}
      {(form.type !== "crypto" || isEdit) && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            {t.tracker.currentPriceHeader}
            <span className="text-muted-foreground font-normal ml-1">{t.tracker.currentPriceOptional}</span>
          </Label>
          <Input
            type="number"
            step="any"
            min="0"
            value={form.currentPrice}
            onChange={e => setForm(f => ({ ...f, currentPrice: e.target.value }))}
            placeholder={t.tracker.leaveBlankUnknown}
            className="h-9"
          />
        </div>
      )}

      {/* P/L preview */}
      {totalCost > 0 && (
        <div className="rounded-lg bg-muted/50 border border-border/40 p-3 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>{t.tracker.totalCostLabel}</span>
            <span className="tabular-nums font-medium text-foreground">{formatCurrency(totalCost)}</span>
          </div>
          {hasCurr && (
            <>
              <div className="flex justify-between text-muted-foreground">
                <span>{t.tracker.currentValueLabel}</span>
                <span className="tabular-nums font-medium text-foreground">{formatCurrency(totalVal)}</span>
              </div>
              <div className={`flex justify-between font-semibold border-t border-border/40 pt-2 ${pl >= 0 ? "text-chart-1" : "text-destructive"}`}>
                <span>{t.tracker.estimatedPL}</span>
                <span className="tabular-nums">
                  {pl >= 0 ? "+" : ""}{formatCurrency(pl)} ({plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%)
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────

export default function AssetsPage() {
  const { assets, loading, error, reload } = usePortfolioAssets()
  const { t } = useLanguage()

  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  // Add modal
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM)
  const [addCoinOpen, setAddCoinOpen] = useState(false)
  const [addCoin, setAddCoin] = useState<Coin | null>(null)
  const addCoinSearch = useCoinSearch()
  const [adding, setAdding] = useState(false)

  // Edit modal
  const [editTarget, setEditTarget] = useState<AssetRow | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── Derived data ──

  const rows: AssetRow[] = useMemo(() =>
    assets.map(a => {
      const val = a.value ?? a.lots * (a.currentPrice ?? 0)
      const cost = a.lots * (a.buyPrice ?? 0)
      const profit = val - cost
      const pct = cost > 0 ? (profit / cost) * 100 : 0
      return { ...a, val, cost, profit, pct }
    }),
    [assets]
  )

  const categories = useMemo(() => {
    const uniq = new Set(assets.map(a => a.category?.toLowerCase()).filter(Boolean))
    return Array.from(uniq) as string[]
  }, [assets])

  const filtered = useMemo(() => {
    let list = activeCategory === "all" ? rows : rows.filter(a => a.category?.toLowerCase() === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a => a.name.toLowerCase().includes(q))
    }
    return list.sort((a, b) => b.val - a.val)
  }, [rows, activeCategory, search])

  const stats = useMemo(() => {
    const totalVal = rows.reduce((s, a) => s + a.val, 0)
    const totalCost = rows.reduce((s, a) => s + a.cost, 0)
    const totalProfit = totalVal - totalCost
    const totalPct = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
    const byPct = [...rows].sort((a, b) => b.pct - a.pct)
    return {
      totalVal,
      totalProfit,
      totalPct,
      best: byPct[0] ?? null,
      worst: byPct[byPct.length - 1] ?? null,
    }
  }, [rows])

  // ── Handlers ──

  const openAdd = useCallback(() => {
    setAddForm(EMPTY_FORM)
    setAddCoin(null)
    addCoinSearch.setQuery("")
    setAddOpen(true)
  }, [addCoinSearch])

  const openEdit = useCallback((asset: AssetRow) => {
    setEditTarget(asset)
    setEditForm({
      name: asset.name,
      amount: String(asset.lots),
      buyPrice: String(asset.buyPrice),
      currentPrice: String(asset.currentPrice ?? 0),
      type: asset.type ?? "manual",
      category: asset.category ?? "",
      coinId: asset.coinId ?? "",
    })
  }, [])

  const handleAdd = async () => {
    if (!addForm.name || !addForm.amount || !addForm.buyPrice) return
    setAdding(true)
    try {
      await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          amount: parseFloat(addForm.amount),
          buyPrice: parseFloat(addForm.buyPrice),
          type: addForm.type,
          category: addForm.category,
          color: "bg-primary",
          coinId: addForm.coinId || undefined,
        }),
      })
      setAddOpen(false)
      reload()
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async () => {
    if (!editTarget || !editForm.name || !editForm.amount || !editForm.buyPrice) return
    setSaving(true)
    try {
      await fetch(`/api/assets/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          amount: parseFloat(editForm.amount),
          buyPrice: parseFloat(editForm.buyPrice),
          type: editForm.type,
          category: editForm.category,
          color: editTarget.color ?? "bg-primary",
          coinId: editForm.coinId || undefined,
        }),
      })
      setEditTarget(null)
      reload()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editTarget) return
    setDeleting(true)
    try {
      await fetch(`/api/assets/${editTarget.id}`, { method: "DELETE" })
      setEditTarget(null)
      reload()
    } finally {
      setDeleting(false)
    }
  }

  const isAddValid = addForm.name && addForm.amount && addForm.buyPrice
  const isEditValid = editForm.name && editForm.amount && editForm.buyPrice

  // ── Render ──

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">{t.tracker.assetsTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.tracker.managePortfolio}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={reload} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            {t.tracker.refresh}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" /> {t.tracker.addAsset}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Stat
          icon={Wallet}
          label={t.tracker.totalPortfolioStat}
          value={loading ? "—" : formatCurrency(stats.totalVal)}
          sub={`${rows.length} ${t.tracker.investmentAssets}`}
        />
        <Stat
          icon={stats.totalProfit >= 0 ? TrendingUp : TrendingDown}
          label={t.tracker.totalPL}
          value={loading ? "—" : `${stats.totalProfit >= 0 ? "+" : ""}${formatCurrency(stats.totalProfit)}`}
          sub={loading ? undefined : `${stats.totalPct >= 0 ? "+" : ""}${stats.totalPct.toFixed(2)}% ${t.tracker.fromCapital}`}
          up={rows.length > 0 ? stats.totalProfit >= 0 : undefined}
        />
        <Stat
          icon={ArrowUpRight}
          label={t.tracker.bestPerformer}
          value={loading ? "—" : stats.best ? `${stats.best.pct >= 0 ? "+" : ""}${stats.best.pct.toFixed(2)}%` : "—"}
          sub={stats.best?.name}
          up={stats.best ? true : undefined}
        />
        <Stat
          icon={ArrowDownRight}
          label={t.tracker.worstPerformer}
          value={loading ? "—" : stats.worst && stats.worst !== stats.best ? `${stats.worst.pct.toFixed(2)}%` : "—"}
          sub={stats.worst && stats.worst !== stats.best ? stats.worst.name : undefined}
          up={stats.worst && stats.worst !== stats.best ? false : undefined}
        />
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {t.tracker.allFilter}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeCategory === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {rows.length}
            </span>
          </button>
          {categories.map(cat => {
            const cfg = catCfg(cat)
            const count = rows.filter(a => a.category?.toLowerCase() === cat).length
            return (
              <button
                type="button"
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {cfg.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeCategory === cat ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-52">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.tracker.searchAssetsPlaceholder}
            className="pl-8 h-8 text-sm bg-card"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive p-3 rounded-lg border border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table card */}
      <Card className="border-border/50 overflow-hidden">
        {/* Table header — desktop only */}
        <div className="hidden md:grid md:grid-cols-[minmax(0,2.5fr)_80px_1fr_1fr_1fr_1fr_40px] px-5 py-2.5 border-b border-border/40 bg-muted/30">
          {[t.tracker.assetHeader, t.tracker.lotsHeader, t.tracker.buyPriceHeader, t.tracker.currentPriceHeader, t.tracker.valueHeader, "P/L", ""].map((h, i) => (
            <span key={i} className={`text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ${i > 0 ? "text-right" : ""}`}>
              {h}
            </span>
          ))}
        </div>

        <div className="divide-y divide-border/30">
          {/* Skeleton */}
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="animate-shimmer h-12 rounded-lg" />
            </div>
          ))}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-3 opacity-10" />
              <p className="text-sm font-medium">
                {assets.length === 0 ? t.tracker.noAssetsYet : t.tracker.noAssetsMatch}
              </p>
              <p className="text-xs mt-1 max-w-xs">
                {assets.length === 0
                  ? t.tracker.noAssetsYetDesc
                  : t.tracker.noAssetsMatchDesc}
              </p>
              {assets.length === 0 && (
                <Button variant="outline" size="sm" className="mt-5 gap-1.5 text-xs" onClick={openAdd}>
                  <Plus className="h-3.5 w-3.5" /> {t.tracker.addFirstAsset}
                </Button>
              )}
            </div>
          )}

          {/* Rows */}
          {!loading && filtered.map((asset, idx) => {
            const cfg = catCfg(asset.category)
            const up = asset.profit >= 0
            const hasLivePrice = !!asset.coinId && asset.currentPrice > 0

            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.025, duration: 0.25 }}
                className="group px-5 py-4 hover:bg-muted/20 transition-colors cursor-default"
              >
                {/* Mobile layout */}
                <div className="flex md:hidden items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${cfg.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                    {asset.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.lots} lots</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(asset.val)}</p>
                    <p className={`text-xs flex items-center justify-end gap-0.5 tabular-nums ${up ? "text-chart-1" : "text-destructive"}`}>
                      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(asset.pct).toFixed(2)}%
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => openEdit(asset)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid md:grid-cols-[minmax(0,2.5fr)_80px_1fr_1fr_1fr_1fr_40px] items-center gap-2">
                  {/* Asset info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${cfg.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                      {asset.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{asset.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`inline-flex items-center text-[10px] px-1.5 py-px rounded-full border ${cfg.pill}`}>
                          {cfg.label}
                        </span>
                        {hasLivePrice && (
                          <span className="text-[10px] text-muted-foreground">live</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground text-right tabular-nums">{asset.lots}</p>
                  <p className="text-sm text-right tabular-nums">{formatCurrency(asset.buyPrice)}</p>
                  <p className="text-sm text-right tabular-nums">
                    {asset.currentPrice > 0
                      ? formatCurrency(asset.currentPrice)
                      : <span className="text-muted-foreground text-xs">—</span>
                    }
                  </p>
                  <p className="text-sm font-semibold text-right tabular-nums">{formatCurrency(asset.val)}</p>

                  {/* P/L column */}
                  <div className="text-right">
                    <p className={`text-sm font-semibold tabular-nums ${up ? "text-chart-1" : "text-destructive"}`}>
                      {up ? "+" : ""}{formatCurrency(asset.profit)}
                    </p>
                    <p className={`text-[11px] flex items-center justify-end gap-0.5 tabular-nums ${up ? "text-chart-1" : "text-destructive"}`}>
                      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(asset.pct).toFixed(2)}%
                    </p>
                  </div>

                  {/* Edit button */}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openEdit(asset)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-border/30 bg-muted/10 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{filtered.length} aset ditampilkan</p>
            <p className="text-xs text-muted-foreground font-medium tabular-nums">
              Total: {formatCurrency(filtered.reduce((s, a) => s + a.val, 0))}
            </p>
          </div>
        )}
      </Card>

      {/* ── Add Asset Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              {t.tracker.addNewAsset}
            </DialogTitle>
          </DialogHeader>

          <AssetForm
            form={addForm}
            setForm={setAddForm}
            isEdit={false}
            coinSearch={addCoinSearch}
            coinOpen={addCoinOpen}
            setCoinOpen={setAddCoinOpen}
            selectedCoin={addCoin}
            setSelectedCoin={setAddCoin}
          />

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)} disabled={adding}>
              {t.common.cancel}
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={adding || !isAddValid} className="gap-1.5">
              {adding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t.tracker.addAsset}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Asset Dialog ── */}
      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className={`w-7 h-7 rounded-lg bg-linear-to-br ${catCfg(editTarget?.category ?? "").gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                {editTarget?.name.substring(0, 2).toUpperCase()}
              </div>
              {t.tracker.editAsset}
            </DialogTitle>
          </DialogHeader>

          <AssetForm
            form={editForm}
            setForm={setEditForm}
            isEdit={true}
            coinSearch={addCoinSearch}
            coinOpen={false}
            setCoinOpen={() => {}}
            selectedCoin={null}
            setSelectedCoin={() => {}}
          />

          <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleting || saving}
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {t.common.delete}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditTarget(null)} disabled={saving}>
                {t.common.cancel}
              </Button>
              <Button size="sm" onClick={handleUpdate} disabled={saving || !isEditValid} className="gap-1.5">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t.common.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
