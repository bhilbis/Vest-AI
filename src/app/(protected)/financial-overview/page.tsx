/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  DownloadIcon,
  Loader2,
  MoreHorizontal,
  PlusIcon,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ShoppingBag,
  Car,
  Utensils,
  Home,
  CreditCard,
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  PieChart,
  CalendarDays,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Sparkles,
} from "lucide-react"

import { ExpenseSummaryCards } from "@/components/expenses/ExpenseSummaryCard"
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog"
import { useExpenseForm } from "@/hooks/useExpensesForm"
import { TransferFormDialog } from "@/components/expenses/TransferFormDialog"
import { AccountBalanceFormDialog } from "@/components/balance-type/BalanceTypeFormDialog"
import { BudgetFormDialog } from "@/components/budgets/BudgetFormDialog"
import { IncomeFormDialog } from "@/components/income/IncomeFormDialog"

import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  calculateExpenseSummary,
} from "@/lib/expenseUtils"

import { Budget, Expense } from "@/types/types"
import { PageWrapper } from "@/components/layout/page-wrapper"

// ==================== TYPES ====================
export interface AccountBalance {
  id: string
  name: string
  type: string
  balance: number
  createdAt: string
}

type MergedRecord = {
  type: "expense" | "transfer"
  id: string
  title: string
  amount: number
  category?: string
  description?: string
  photoUrl: string | null
  date: string
  accountId?: string
  sourceAccountName?: string
  budgetName?: string | null
}

type BudgetWithUsage = Budget & {
  spent: number
  remaining: number
  monthKey: string
}

// ==================== CONSTANTS ====================
const ACCOUNT_TYPE_LABELS = {
  cash: "Cash",
  bank: "Bank",
  ewallet: "E-Wallet",
} as const

const ACCOUNT_TYPE_EMOJI: Record<string, string> = {
  cash: "💵",
  bank: "🏦",
  ewallet: "📱",
}

// ==================== UTILITY ====================
const getRecordIcon = (record: MergedRecord) => {
  if (record.type === "transfer") {
    if (record.category === "topup") return ArrowUpRight
    if (record.category === "withdraw") return ArrowDownRight
    return ArrowLeftRight
  }
  const key = record.category?.toLowerCase()
  if (key?.includes("food") || key?.includes("makan")) return Utensils
  if (key?.includes("transport") || key?.includes("transportasi")) return Car
  if (key?.includes("shopping") || key?.includes("belanja")) return ShoppingBag
  if (key?.includes("housing") || key?.includes("sewa") || key?.includes("rumah")) return Home
  if (key?.includes("bill") || key?.includes("tagihan") || key?.includes("kartu")) return CreditCard
  return Wallet
}

const formatMonthLabel = (monthStr: string) => {
  const [year, month] = monthStr.split("-").map(Number)
  if (!year || !month) return monthStr
  return new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
}

const getMonthKey = (value?: string | Date) => {
  if (!value) return new Date().toISOString().slice(0, 7)
  const parsed = typeof value === "string" ? new Date(value) : value
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), 1)).toISOString().slice(0, 7)
}

// ==================== NEO-BRUTALISM CARD COMPONENT ====================
function NeoCard({
  children,
  className = "",
  accent = "border-border",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { accent?: string }) {
  return (
    <div
      className={`rounded-2xl border-2 ${accent} bg-card shadow-[4px_4px_0px_0px] shadow-border/40 transition-all duration-200 hover:shadow-[6px_6px_0px_0px] hover:shadow-border/50 hover:-translate-y-0.5 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

function SectionTitle({ icon: Icon, title, color = "text-primary" }: { icon: React.ElementType; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`h-9 w-9 rounded-xl border-2 border-border bg-muted flex items-center justify-center shadow-[2px_2px_0px_0px] shadow-border/30`}>
        <Icon className={`h-4.5 w-4.5 ${color}`} />
      </div>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
    </div>
  )
}

// ==================== MAIN COMPONENT ====================
export default function FinancialOverviewPage() {
  const [data, setData] = useState({
    expenses: [] as Expense[],
    transfers: [] as any[],
    accounts: [] as AccountBalance[],
    budgets: [] as BudgetWithUsage[],
  })
  const [loading, setLoading] = useState({ expenses: true, accounts: true, budgets: true })
  const [dialogs, setDialogs] = useState({ expense: false, transfer: false, account: false, budget: false, income: false })
  const currentMonthKey = useMemo(() => getMonthKey(), [])
  const [editing, setEditing] = useState<{ account: AccountBalance | null; budget: BudgetWithUsage | null }>({ account: null, budget: null })
  const [filters, setFilters] = useState({ category: "all", startDate: "", endDate: "", month: currentMonthKey })

  const {
    formData, editingExpense, removePhoto,
    updateFormData, handlePhotoChange, handleRemovePhoto, handleEdit, resetForm,
  } = useExpenseForm()

  // ==================== COMPUTED ====================
  const expenseMonthKey = useMemo(() => formData.date ? formData.date.slice(0, 7) : new Date().toISOString().slice(0, 7), [formData.date])
  const budgetsForExpense = useMemo(() => data.budgets.filter((b) => b.monthKey === expenseMonthKey), [data.budgets, expenseMonthKey])
  const selectedMonthLabel = useMemo(() => formatMonthLabel(filters.month), [filters.month])

  const updateMonth = useCallback((v: string) => { if (v) setFilters((p) => ({ ...p, month: v, startDate: "", endDate: "" })) }, [])
  const resetToCurrentMonth = useCallback(() => updateMonth(currentMonthKey), [currentMonthKey, updateMonth])
  const shiftMonth = useCallback((d: number) => {
    const [y, m] = filters.month.split("-").map(Number)
    if (!y || !m) return
    updateMonth(getMonthKey(new Date(Date.UTC(y, m - 1 + d, 1))))
  }, [filters.month, updateMonth])

  const mergedHistory = useMemo(() => {
    const mapped: MergedRecord[] = [
      ...data.expenses.map((ex) => ({
        type: "expense" as const, id: ex.id, title: ex.title, amount: ex.amount,
        category: ex.category || "", description: ex.description || "", photoUrl: ex.photoUrl,
        date: ex.date, accountId: ex.accountId, budgetName: ex.budget?.name ?? null,
      })),
      ...data.transfers.map((tr) => {
        let title = "", category = ""
        if (tr.fromAccount.type !== "cash" && tr.toAccount.type === "cash") { title = `Tarik Tunai dari ${tr.fromAccount.name}`; category = "withdraw" }
        else if (tr.fromAccount.type === "cash" && tr.toAccount.type !== "cash") { title = `Top Up ke ${tr.toAccount.name}`; category = "topup" }
        else { title = `${tr.fromAccount.name} → ${tr.toAccount.name}`; category = "transfer" }
        return { type: "transfer" as const, id: tr.id, title, amount: tr.amount, category, description: tr.note ?? "", photoUrl: null, date: tr.date, sourceAccountName: tr.fromAccount?.name }
      }),
    ]
    return mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data.expenses, data.transfers])

  const summary = useMemo(() => calculateExpenseSummary(data.expenses), [data.expenses])
  const totalBalance = useMemo(() => data.accounts.reduce((s, a) => s + a.balance, 0), [data.accounts])
  const budgetTotals = useMemo(() => data.budgets.reduce((a, b) => ({ limit: a.limit + b.limit, spent: a.spent + b.spent }), { limit: 0, spent: 0 }), [data.budgets])
  const budgetProgress = budgetTotals.limit ? Math.min((budgetTotals.spent / budgetTotals.limit) * 100, 100) : 0

  // ==================== DATA FETCHING (same as before) ====================
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading((p) => ({ ...p, accounts: true }))
      const res = await fetch("/api/account-balance")
      if (!res.ok) return
      let d = await res.json()
      if (!d.find((a: any) => a.type === "cash")) {
        await fetch("/api/account-balance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Cash", type: "cash", balance: 0 }) })
        const r2 = await fetch("/api/account-balance"); d = await r2.json()
      }
      setData((p) => ({ ...p, accounts: d }))
    } catch (e) { console.error("Error fetching accounts:", e) }
    finally { setLoading((p) => ({ ...p, accounts: false })) }
  }, [])

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading((p) => ({ ...p, expenses: true }))
      const params = new URLSearchParams()
      params.append("month", filters.month)
      if (filters.category !== "all") params.append("category", filters.category)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      const res = await fetch(`/api/expenses?${params.toString()}`)
      if (!res.ok) return
      const expData = await res.json()
      setData((p) => ({ ...p, expenses: expData }))
    } catch (e) { console.error("Error fetching expenses:", e) }
    finally { setLoading((p) => ({ ...p, expenses: false })) }
  }, [filters.category, filters.startDate, filters.endDate, filters.month])

  const fetchTransfers = useCallback(async () => {
    try {
      const res = await fetch(`/api/transfers?month=${filters.month}`)
      if (!res.ok) return
      const trfData = await res.json()
      setData((p) => ({ ...p, transfers: trfData }))
    } catch (e) { console.error("Error fetching transfers:", e) }
  }, [filters.month])

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading((p) => ({ ...p, budgets: true }))
      const res = await fetch(`/api/budgets?month=${filters.month}`)
      if (!res.ok) return
      const fd = await res.json()
      const normalized = (fd.budgets ?? []).map((b: any) => {
        const spent = Number(b.spent ?? 0)
        const remaining = Number(b.remaining ?? Math.max(b.limit - spent, 0))
        const monthKey = b.monthKey ? b.monthKey : typeof b.month === "string" ? b.month.slice(0, 7) : new Date(b.month).toISOString().slice(0, 7)
        return { ...b, spent, remaining, monthKey } as BudgetWithUsage
      })
      setData((p) => ({ ...p, budgets: normalized }))
    } catch (e) { console.error("Error fetching budgets:", e) }
    finally { setLoading((p) => ({ ...p, budgets: false })) }
  }, [filters.month])

  useEffect(() => { fetchAccounts(); fetchExpenses(); fetchTransfers(); fetchBudgets() }, [fetchAccounts, fetchExpenses, fetchTransfers, fetchBudgets])

  // ==================== EVENT HANDLERS (same as before) ====================
  const handleSubmitExpense = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append("title", formData.title); fd.append("amount", formData.amount)
      fd.append("category", formData.category); fd.append("description", formData.description)
      fd.append("date", formData.date); fd.append("accountId", formData.accountId)
      fd.append("budgetId", formData.budgetId || "")
      if (formData.photo) fd.append("photo", formData.photo)
      if (editingExpense && removePhoto) fd.append("removePhoto", "true")
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses"
      const res = await fetch(url, { method: editingExpense ? "PUT" : "POST", body: fd })
      if (!res.ok) throw new Error("Failed")
      await Promise.all([fetchExpenses(), fetchBudgets()])
      resetForm(); setDialogs((p) => ({ ...p, expense: false }))
    } catch { alert("Gagal menyimpan pengeluaran") }
  }, [formData, editingExpense, removePhoto, fetchExpenses, fetchBudgets, resetForm])

  const handleDeleteExpense = useCallback(async (id: string) => {
    if (!confirm("Hapus pengeluaran ini?")) return
    try { const r = await fetch(`/api/expenses/${id}`, { method: "DELETE" }); if (!r.ok) throw new Error("Failed"); await Promise.all([fetchExpenses(), fetchBudgets()]) } catch { alert("Gagal menghapus") }
  }, [fetchExpenses, fetchBudgets])

  const handleEditExpense = useCallback((expense: Expense) => { handleEdit(expense); setDialogs((p) => ({ ...p, expense: true })) }, [handleEdit])

  const handleExportExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.append("month", filters.month)
      if (filters.category !== "all") params.append("category", filters.category)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)
      const res = await fetch(`/api/expenses/export?${params.toString()}`)
      if (!res.ok) throw new Error("Failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url
      a.download = `pengeluaran-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a)
    } catch { alert("Gagal mengekspor data") }
  }, [filters])

  const handleDeleteAccount = useCallback(async (id: string) => { if (!confirm("Hapus akun?")) return; try { const r = await fetch(`/api/account-balance/${id}`, { method: "DELETE" }); if (!r.ok) throw new Error("Failed"); await fetchAccounts() } catch { alert("Gagal menghapus") } }, [fetchAccounts])
  const handleDeleteBudget = useCallback(async (id: string) => { if (!confirm("Hapus budget?")) return; try { const r = await fetch(`/api/budgets/${id}`, { method: "DELETE" }); if (!r.ok) throw new Error("Failed"); await fetchBudgets() } catch { alert("Gagal menghapus") } }, [fetchBudgets])

  const isLoading = loading.expenses || loading.accounts || loading.budgets

  // ==================== RENDER ====================
  return (
    <PageWrapper maxWidth="lg" className="space-y-8">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-muted px-3 py-1 text-xs font-semibold shadow-[2px_2px_0px_0px] shadow-border/30">
            <Sparkles className="h-3 w-3 text-chart-4" />
            {selectedMonthLabel}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Financial Overview <span className="inline-block animate-float">💰</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg">
            Semua keuangan kamu dalam satu halaman. Simple, clear, no BS.
          </p>
        </div>

        {/* Month Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-2 border-border shadow-[2px_2px_0px_0px] shadow-border/30 active:shadow-none active:translate-x-0.5 active:translate-y-0.5" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input type="month" value={filters.month} onChange={(e) => updateMonth(e.target.value)} className="w-36 rounded-xl border-2 border-border font-semibold shadow-[2px_2px_0px_0px] shadow-border/30" />
          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-2 border-border shadow-[2px_2px_0px_0px] shadow-border/30 active:shadow-none active:translate-x-0.5 active:translate-y-0.5" onClick={() => shiftMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {filters.month !== currentMonthKey && (
            <Button variant="ghost" size="sm" onClick={resetToCurrentMonth} className="text-xs font-bold text-primary">
              Hari ini
            </Button>
          )}
        </div>
      </header>

      {/* ═══════════ QUICK ACTIONS BAR ═══════════ */}
      <NeoCard accent="border-primary/60" className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">Quick Actions</p>
              <p className="text-xs text-muted-foreground">Akses cepat ke semua fitur</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="rounded-xl border-2 border-chart-1/50 bg-chart-1 text-white font-bold shadow-[2px_2px_0px_0px] shadow-chart-1/30 hover:bg-chart-1/90 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 gap-1.5" onClick={() => setDialogs((p) => ({ ...p, expense: true }))}>
              <PlusIcon className="h-3.5 w-3.5" /> Pengeluaran
            </Button>
            <Button size="sm" className="rounded-xl border-2 border-chart-2/50 bg-chart-2 text-white font-bold shadow-[2px_2px_0px_0px] shadow-chart-2/30 hover:bg-chart-2/90 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 gap-1.5" onClick={() => setDialogs((p) => ({ ...p, income: true }))}>
              <ArrowUpRight className="h-3.5 w-3.5" /> Pemasukan
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl border-2 border-border font-bold shadow-[2px_2px_0px_0px] shadow-border/30 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 gap-1.5" onClick={() => setDialogs((p) => ({ ...p, transfer: true }))}>
              <ArrowLeftRight className="h-3.5 w-3.5" /> Transfer
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl border-2 border-border font-bold shadow-[2px_2px_0px_0px] shadow-border/30 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 gap-1.5" onClick={() => { setEditing((p) => ({ ...p, budget: null })); setDialogs((p) => ({ ...p, budget: true })) }}>
              <Target className="h-3.5 w-3.5" /> Set Budget
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl border-2 border-border font-bold shadow-[2px_2px_0px_0px] shadow-border/30 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 gap-1.5" onClick={handleExportExpenses}>
              <DownloadIcon className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>
      </NeoCard>

      {/* ═══════════ STATS ROW ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <NeoCard accent="border-chart-1/50" className="p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Saldo</p>
          {loading.accounts ? <div className="animate-shimmer h-8 w-28 rounded" /> : (
            <p className="text-2xl font-black tabular-nums text-chart-1">{formatCurrency(totalBalance)}</p>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">{data.accounts.length} akun aktif</p>
        </NeoCard>

        <NeoCard accent="border-destructive/50" className="p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Pengeluaran</p>
          {loading.expenses ? <div className="animate-shimmer h-8 w-28 rounded" /> : (
            <p className="text-2xl font-black tabular-nums text-destructive">{formatCurrency(summary.total)}</p>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">{summary.count} transaksi</p>
        </NeoCard>

        <NeoCard accent="border-primary/50" className="p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Budget Used</p>
          {loading.budgets ? <div className="animate-shimmer h-8 w-28 rounded" /> : (
            <>
              <p className={`text-2xl font-black tabular-nums ${budgetProgress > 90 ? "text-destructive" : budgetProgress > 70 ? "text-chart-4" : "text-primary"}`}>
                {budgetProgress.toFixed(0)}%
              </p>
              <Progress value={budgetProgress} className="h-1.5 mt-2" />
            </>
          )}
        </NeoCard>

        <NeoCard accent="border-chart-2/50" className="p-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Avg Expense</p>
          {loading.expenses ? <div className="animate-shimmer h-8 w-28 rounded" /> : (
            <p className="text-2xl font-black tabular-nums text-chart-2">{formatCurrency(summary.average)}</p>
          )}
          <p className="text-[11px] text-muted-foreground mt-1">per transaksi</p>
        </NeoCard>
      </div>

      {/* ═══════════ MAIN GRID: 2 COLUMNS ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COL: Accounts + Budgets ── */}
        <div className="lg:col-span-5 space-y-6">

          {/* ACCOUNTS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle icon={Wallet} title="Akun Saldo" />
              <Button size="sm" variant="outline" className="rounded-xl border-2 border-border font-bold text-xs shadow-[2px_2px_0px_0px] shadow-border/30 active:shadow-none gap-1" onClick={() => { setEditing((p) => ({ ...p, account: null })); setDialogs((p) => ({ ...p, account: true })) }}>
                <PlusIcon className="h-3 w-3" /> Tambah
              </Button>
            </div>

            {loading.accounts ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="animate-shimmer h-20 rounded-2xl" />)}</div>
            ) : data.accounts.length === 0 ? (
              <NeoCard className="p-8 text-center">
                <p className="text-4xl mb-2">🏦</p>
                <p className="font-bold">Belum ada akun</p>
                <p className="text-xs text-muted-foreground mb-3">Tambahkan akun pertamamu!</p>
                <Button size="sm" className="rounded-xl gap-1" onClick={() => { setEditing((p) => ({ ...p, account: null })); setDialogs((p) => ({ ...p, account: true })) }}>
                  <PlusIcon className="h-3 w-3" /> Buat Akun
                </Button>
              </NeoCard>
            ) : (
              <div className="space-y-3">
                {data.accounts.map((acc) => (
                  <NeoCard key={acc.id} className="p-4 group">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{ACCOUNT_TYPE_EMOJI[acc.type] || "💳"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate">{acc.name}</p>
                          <Badge variant="outline" className="text-[10px] capitalize border-2 rounded-lg">{ACCOUNT_TYPE_LABELS[acc.type as keyof typeof ACCOUNT_TYPE_LABELS] || acc.type}</Badge>
                        </div>
                        <p className="text-lg font-black tabular-nums text-chart-1">{formatCurrency(acc.balance)}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => { setEditing((p) => ({ ...p, account: acc })); setDialogs((p) => ({ ...p, account: true })) }}><Edit className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive cursor-pointer text-xs" onClick={() => handleDeleteAccount(acc.id)}><Trash2 className="h-3.5 w-3.5" /> Hapus</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </NeoCard>
                ))}
              </div>
            )}
          </section>

          {/* BUDGETS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle icon={PieChart} title="Budgets" color="text-chart-4" />
              <Button size="sm" variant="outline" className="rounded-xl border-2 border-border font-bold text-xs shadow-[2px_2px_0px_0px] shadow-border/30 active:shadow-none gap-1" onClick={() => { setEditing((p) => ({ ...p, budget: null })); setDialogs((p) => ({ ...p, budget: true })) }}>
                <PlusIcon className="h-3 w-3" /> Budget
              </Button>
            </div>

            {loading.budgets ? (
              <div className="space-y-3">{[1, 2].map(i => <div key={i} className="animate-shimmer h-24 rounded-2xl" />)}</div>
            ) : data.budgets.length === 0 ? (
              <NeoCard className="p-8 text-center">
                <p className="text-4xl mb-2">🎯</p>
                <p className="font-bold">Belum ada budget</p>
                <p className="text-xs text-muted-foreground mb-3">Set budget untuk kontrol pengeluaranmu</p>
                <Button size="sm" className="rounded-xl gap-1" onClick={() => { setEditing((p) => ({ ...p, budget: null })); setDialogs((p) => ({ ...p, budget: true })) }}>
                  <PlusIcon className="h-3 w-3" /> Set Budget
                </Button>
              </NeoCard>
            ) : (
              <div className="space-y-3">
                {/* Budget Summary */}
                <NeoCard accent="border-chart-4/40" className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-muted-foreground">RINGKASAN BUDGET</p>
                    <span className={`text-sm font-black tabular-nums ${budgetProgress > 90 ? "text-destructive" : budgetProgress > 70 ? "text-chart-4" : "text-chart-1"}`}>{budgetProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={budgetProgress} className="h-2.5 rounded-full mb-2" />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Terpakai: {formatCurrency(budgetTotals.spent)}</span>
                    <span>Limit: {formatCurrency(budgetTotals.limit)}</span>
                  </div>
                </NeoCard>

                {/* Individual budgets */}
                {data.budgets.map((budget) => {
                  const usage = budget.limit ? Math.min((budget.spent / budget.limit) * 100, 100) : 0
                  const color = usage > 90 ? "border-destructive/50" : usage > 70 ? "border-chart-4/50" : "border-chart-1/40"

                  return (
                    <NeoCard key={budget.id} accent={color} className="p-4 group">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{budget.name}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">{budget.category || "Budget"}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className={`text-[10px] font-black border-2 rounded-lg tabular-nums ${usage > 90 ? "border-destructive/50 text-destructive" : usage > 70 ? "border-chart-4/50 text-chart-4" : "border-chart-1/50 text-chart-1"}`}>
                            {usage.toFixed(0)}%
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => { setEditing((p) => ({ ...p, budget })); setDialogs((p) => ({ ...p, budget: true })) }}><Edit className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive cursor-pointer text-xs" onClick={() => handleDeleteBudget(budget.id)}><Trash2 className="h-3.5 w-3.5" /> Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <Progress value={usage} className="h-1.5 rounded-full mb-1.5" />
                      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                        <span>{formatCurrency(budget.spent)}</span>
                        <span>{formatCurrency(budget.limit)}</span>
                      </div>
                    </NeoCard>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── RIGHT COL: Expense Summary + Activity ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* EXPENSE SUMMARY */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle icon={TrendingUp} title="Pengeluaran" color="text-chart-1" />
              <div className="flex gap-2">
                <Button size="sm" className="rounded-xl border-2 border-chart-1/50 bg-chart-1 text-white font-bold text-xs shadow-[2px_2px_0px_0px] shadow-chart-1/30 hover:bg-chart-1/90 active:shadow-none gap-1" onClick={() => setDialogs((p) => ({ ...p, expense: true }))}>
                  <PlusIcon className="h-3 w-3" /> Tambah
                </Button>
              </div>
            </div>
            <ExpenseSummaryCards
              totalExpenses={summary.total}
              expensesCount={summary.count}
              averageExpense={summary.average}
              topCategory={summary.topCategory}
              formatCurrency={formatCurrency}
            />
          </section>

          {/* RECENT ACTIVITY */}
          <section className="space-y-4">
            <SectionTitle icon={Activity} title="Aktivitas Terbaru" color="text-chart-2" />

            <NeoCard className="overflow-hidden">
              {loading.expenses ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : mergedHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-4xl mb-2">📭</p>
                  <p className="font-bold">Belum ada aktivitas</p>
                  <p className="text-xs text-muted-foreground">Transaksimu akan muncul di sini</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {mergedHistory.slice(0, 15).map((record) => {
                    const Icon = getRecordIcon(record)
                    const isNegative = record.type === "expense" || (record.type === "transfer" && record.category !== "topup")
                    const accountName = record.type === "expense" && record.accountId ? data.accounts.find((a) => a.id === record.accountId)?.name : record.sourceAccountName

                    return (
                      <li key={record.id + record.type} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group">
                        <div className={`h-9 w-9 rounded-xl border-2 flex items-center justify-center shrink-0 ${record.type === "transfer" ? "border-primary/30 bg-primary/5 text-primary" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{record.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(record.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                            </span>
                            {record.category && record.category !== "transfer" && (
                              <Badge variant="outline" className="text-[10px] capitalize border rounded-md h-4 px-1.5">{record.category}</Badge>
                            )}
                            {accountName && (
                              <Badge variant="secondary" className="text-[10px] border rounded-md h-4 px-1.5">via {accountName}</Badge>
                            )}
                          </div>
                        </div>

                        <p className={`text-sm font-black tabular-nums shrink-0 ${isNegative ? "text-destructive" : "text-chart-1"}`}>
                          {isNegative ? "−" : "+"}{formatCurrency(record.amount)}
                        </p>

                        {record.type === "expense" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => { const exp = data.expenses.find(e => e.id === record.id); if (exp) handleEditExpense(exp) }}><Edit className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive cursor-pointer text-xs" onClick={() => handleDeleteExpense(record.id)}><Trash2 className="h-3.5 w-3.5" /> Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </NeoCard>
          </section>
        </div>
      </div>

      {/* ==================== DIALOGS ==================== */}
      <ExpenseFormDialog
        isOpen={dialogs.expense}
        onOpenChange={(open) => { setDialogs((p) => ({ ...p, expense: open })); if (open && !editingExpense) updateFormData({ date: `${filters.month}-01` }); if (!open) resetForm() }}
        formData={formData}
        onFormDataChange={updateFormData}
        onSubmit={handleSubmitExpense}
        onPhotoChange={handlePhotoChange}
        onRemovePhoto={handleRemovePhoto}
        isEditing={!!editingExpense}
        categories={EXPENSE_CATEGORIES}
        accounts={data.accounts}
        budgets={budgetsForExpense}
        existingPhotoUrl={editingExpense?.photoUrl}
      />

      <TransferFormDialog
        isOpen={dialogs.transfer}
        onOpenChange={(open) => setDialogs((p) => ({ ...p, transfer: open }))}
        accounts={data.accounts}
        onSuccess={() => { fetchAccounts(); fetchTransfers(); fetchExpenses() }}
      />

      <AccountBalanceFormDialog
        isOpen={dialogs.account}
        onOpenChange={(open) => { setDialogs((p) => ({ ...p, account: open })); if (!open) setEditing((p) => ({ ...p, account: null })) }}
        fetchData={fetchAccounts}
        editing={editing.account}
      />

      <BudgetFormDialog
        isOpen={dialogs.budget}
        onOpenChange={(open) => { setDialogs((p) => ({ ...p, budget: open })); if (!open) setEditing((p) => ({ ...p, budget: null })) }}
        defaultMonth={filters.month}
        onSuccess={fetchBudgets}
        editing={editing.budget}
      />

      <IncomeFormDialog
        isOpen={dialogs.income}
        onOpenChange={(open) => setDialogs((p) => ({ ...p, income: open }))}
        accounts={data.accounts}
        defaultDate={`${filters.month}-01`}
        onSuccess={() => { fetchAccounts(); fetchExpenses() }}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="rounded-xl border-2 border-border bg-card px-4 py-2 flex items-center gap-2 text-sm shadow-[3px_3px_0px_0px] shadow-border/30">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="font-semibold text-xs">Loading...</span>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}