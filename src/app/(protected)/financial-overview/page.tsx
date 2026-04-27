/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useCallback, useEffect, useMemo, useState, useOptimistic } from "react"
import { Button } from "@/components/ui/button"
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
  PlusIcon,
  Loader2,
  MoreHorizontal,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Target,
  DownloadIcon,
} from "lucide-react"
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog"
import { useExpenseForm } from "@/hooks/useExpensesForm"
import { TransferFormDialog } from "@/components/expenses/TransferFormDialog"
import { AccountBalanceFormDialog } from "@/components/balance-type/BalanceTypeFormDialog"
import { BudgetFormDialog } from "@/components/budgets/BudgetFormDialog"
import { IncomeFormDialog } from "@/components/income/IncomeFormDialog"
import { CashflowChart } from "@/components/tracker/cashflow-chart"
import { ExpensePieChart } from "@/components/tracker/expense-pie-chart"
import { EXPENSE_CATEGORIES, formatCurrency, calculateExpenseSummary } from "@/lib/expenseUtils"
import { Budget, Expense } from "@/types/types"
import { PageWrapper } from "@/components/layout/page-wrapper"
import { cn } from "@/lib/utils"

// ==================== TYPES ====================
interface AccountBalance {
  id: string
  name: string
  type: string
  balance: number
  createdAt: string
}

type MergedRecord = {
  type: "expense" | "transfer" | "income"
  id: string
  title: string
  amount: number
  category?: string
  date: string
  accountId?: string
  accountName?: string
}

type BudgetWithUsage = Budget & { spent: number; remaining: number; monthKey: string }

// ==================== UTILS ====================
const ACCOUNT_TYPE_LABEL: Record<string, string> = { cash: "Cash", bank: "Bank", ewallet: "E-Wallet" }
const ACCOUNT_TYPE_ICON: Record<string, string> = { cash: "💵", bank: "🏦", ewallet: "📱" }

const getMonthKey = (v?: string | Date) => {
  if (!v) return new Date().toISOString().slice(0, 7)
  const d = typeof v === "string" ? new Date(v) : v
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString().slice(0, 7)
}

const formatMonth = (s: string) => {
  const [y, m] = s.split("-").map(Number)
  if (!y || !m) return s
  return new Date(y, m - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })
}

// ==================== MAIN ====================
export default function FinancialOverviewPage() {
  const [data, setData] = useState({
    expenses: [] as Expense[],
    incomes: [] as any[],
    transfers: [] as any[],
    accounts: [] as AccountBalance[],
    budgets: [] as BudgetWithUsage[],
  })
  const [loading, setLoading] = useState({ expenses: true, accounts: true, budgets: true })
  const [dialogs, setDialogs] = useState({ expense: false, transfer: false, account: false, budget: false, income: false })
  const currentMonthKey = useMemo(() => getMonthKey(), [])
  const [editing, setEditing] = useState<{ account: AccountBalance | null; budget: BudgetWithUsage | null }>({ account: null, budget: null })
  const [filters, setFilters] = useState({ category: "all", startDate: "", endDate: "", month: currentMonthKey })

  const { formData, editingExpense, removePhoto, updateFormData, handlePhotoChange, handleRemovePhoto, handleEdit, resetForm } = useExpenseForm()

  // Optimistic accounts for instant UI feedback
  const [optimisticAccounts] = useOptimistic(
    data.accounts,
    (state: AccountBalance[], newAccount: AccountBalance) => [...state, newAccount]
  )

  // ==================== COMPUTED ====================
  const expenseMonthKey = useMemo(() => formData.date ? formData.date.slice(0, 7) : currentMonthKey, [formData.date, currentMonthKey])
  const budgetsForExpense = useMemo(() => data.budgets.filter((b) => b.monthKey === expenseMonthKey), [data.budgets, expenseMonthKey])

  const updateMonth = useCallback((v: string) => { if (v) setFilters((p) => ({ ...p, month: v, startDate: "", endDate: "" })) }, [])
  const shiftMonth = useCallback((d: number) => {
    const [y, m] = filters.month.split("-").map(Number)
    if (!y || !m) return
    updateMonth(getMonthKey(new Date(Date.UTC(y, m - 1 + d, 1))))
  }, [filters.month, updateMonth])

  const mergedHistory = useMemo(() => {
    const mapped: MergedRecord[] = [
      ...data.expenses.map((ex) => ({
        type: "expense" as const, id: ex.id, title: ex.title, amount: ex.amount,
        category: ex.category || "", date: ex.date, accountId: ex.accountId,
      })),
      ...data.incomes.map((inc: any) => ({
        type: "income" as const, id: inc.id, title: inc.title, amount: inc.amount,
        category: "income", date: inc.date, accountId: inc.accountId,
      })),
      ...data.transfers.map((tr: any) => ({
        type: "transfer" as const, id: tr.id,
        title: `${tr.fromAccount?.name || "?"} → ${tr.toAccount?.name || "?"}`,
        amount: tr.amount, category: "transfer", date: tr.date,
        accountName: tr.fromAccount?.name,
      })),
    ]
    return mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [data.expenses, data.incomes, data.transfers])

  const summary = useMemo(() => calculateExpenseSummary(data.expenses), [data.expenses])
  const totalBalance = useMemo(() => optimisticAccounts.reduce((s, a) => s + a.balance, 0), [optimisticAccounts])
  const totalIncome = useMemo(() => data.incomes.reduce((s: number, i: any) => s + (i.amount || 0), 0), [data.incomes])
  const budgetTotals = useMemo(() => data.budgets.reduce((a, b) => ({ limit: a.limit + b.limit, spent: a.spent + b.spent }), { limit: 0, spent: 0 }), [data.budgets])
  const budgetProgress = budgetTotals.limit ? Math.min((budgetTotals.spent / budgetTotals.limit) * 100, 100) : 0

  // Cashflow chart data (use current month)
  const cashflowData = useMemo(() => {
    return [{ month: formatMonth(filters.month).split(" ")[0] || filters.month, income: totalIncome, expense: summary.total }]
  }, [filters.month, totalIncome, summary.total])

  // Expense pie chart data by category
  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    data.expenses.forEach((e) => {
      const cat = e.category || "Lainnya"
      map.set(cat, (map.get(cat) || 0) + e.amount)
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [data.expenses])

  // ==================== FETCH ====================
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
    } catch (e) { console.error(e) }
    finally { setLoading((p) => ({ ...p, accounts: false })) }
  }, [])

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading((p) => ({ ...p, expenses: true }))
      const params = new URLSearchParams()
      params.append("month", filters.month)
      if (filters.category !== "all") params.append("category", filters.category)
      const res = await fetch(`/api/expenses?${params}`)
      if (!res.ok) return
      const jsonObj = await res.json()
      setData((p) => ({ ...p, expenses: jsonObj }))
    } catch (e) { console.error(e) }
    finally { setLoading((p) => ({ ...p, expenses: false })) }
  }, [filters.category, filters.month])

  const fetchIncomes = useCallback(async () => {
    try {
      const res = await fetch(`/api/income?month=${filters.month}`)
      if (!res.ok) return
      const jsonObj = await res.json()
      setData((p) => ({ ...p, incomes: jsonObj }))
    } catch (e) { console.error(e) }
  }, [filters.month])

  const fetchTransfers = useCallback(async () => {
    try {
      const res = await fetch(`/api/transfers?month=${filters.month}`)
      if (!res.ok) return
      const jsonObj = await res.json()
      setData((p) => ({ ...p, transfers: jsonObj }))
    } catch (e) { console.error(e) }
  }, [filters.month])

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading((p) => ({ ...p, budgets: true }))
      const res = await fetch(`/api/budgets?month=${filters.month}`)
      if (!res.ok) return
      const fd = await res.json()
      const normalized = (fd.budgets ?? []).map((b: any) => {
        const spent = Number(b.spent ?? 0)
        const remaining = Math.max(b.limit - spent, 0)
        const monthKey = b.monthKey || (typeof b.month === "string" ? b.month.slice(0, 7) : new Date(b.month).toISOString().slice(0, 7))
        return { ...b, spent, remaining, monthKey } as BudgetWithUsage
      })
      setData((p) => ({ ...p, budgets: normalized }))
    } catch (e) { console.error(e) }
    finally { setLoading((p) => ({ ...p, budgets: false })) }
  }, [filters.month])

  useEffect(() => { fetchAccounts(); fetchExpenses(); fetchIncomes(); fetchTransfers(); fetchBudgets() },
    [fetchAccounts, fetchExpenses, fetchIncomes, fetchTransfers, fetchBudgets])

  // ==================== HANDLERS ====================
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
      await Promise.all([fetchExpenses(), fetchBudgets(), fetchAccounts()])
      resetForm(); setDialogs((p) => ({ ...p, expense: false }))
    } catch { /* ignore */ }
  }, [formData, editingExpense, removePhoto, fetchExpenses, fetchBudgets, fetchAccounts, resetForm])

  const handleDeleteExpense = useCallback(async (id: string) => {
    if (!confirm("Hapus pengeluaran ini?")) return
    try {
      const r = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Failed")
      await Promise.all([fetchExpenses(), fetchBudgets(), fetchAccounts()])
    } catch { /* ignore */ }
  }, [fetchExpenses, fetchBudgets, fetchAccounts])

  const handleEditExpense = useCallback((expense: Expense) => { handleEdit(expense); setDialogs((p) => ({ ...p, expense: true })) }, [handleEdit])

  const handleExportExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams(); params.append("month", filters.month)
      const res = await fetch(`/api/expenses/export?${params}`)
      if (!res.ok) throw new Error("Failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url
      a.download = `pengeluaran-${filters.month}.xlsx`
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a)
    } catch { /* ignore */ }
  }, [filters])

  const handleDeleteAccount = useCallback(async (id: string) => {
    if (!confirm("Hapus akun?")) return
    try { await fetch(`/api/account-balance/${id}`, { method: "DELETE" }); await fetchAccounts() } catch { /* ignore */ }
  }, [fetchAccounts])

  const handleDeleteBudget = useCallback(async (id: string) => {
    if (!confirm("Hapus budget?")) return
    try { await fetch(`/api/budgets/${id}`, { method: "DELETE" }); await fetchBudgets() } catch { /* ignore */ }
  }, [fetchBudgets])

  const isLoading = loading.expenses || loading.accounts || loading.budgets

  // ==================== RENDER ====================
  return (
    <PageWrapper maxWidth="lg" className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">{formatMonth(filters.month)}</p>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-background shadow-none min-h-0 min-w-0" onClick={() => shiftMonth(-1)}>
            <ChevronLeft size={16} />
          </Button>
          <div className="relative">
            <Input 
              type="month" 
              value={filters.month} 
              onChange={(e) => updateMonth(e.target.value)} 
              className="w-[165px] h-8 text-xs bg-background border-input min-h-0 px-2 cursor-pointer focus-visible:ring-1" 
            />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-background shadow-none min-h-0 min-w-0" onClick={() => shiftMonth(1)}>
            <ChevronRight size={16} />
          </Button>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground border-transparent gap-1.5 text-xs font-medium" onClick={() => setDialogs((p) => ({ ...p, expense: true }))}>
          <TrendingDown size={14} /> Pengeluaran
        </Button>
        <Button size="sm" className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground border-transparent gap-1.5 text-xs font-medium" onClick={() => setDialogs((p) => ({ ...p, income: true }))}>
          <TrendingUp size={14} /> Pemasukan
        </Button>
        <Button size="sm" variant="outline" className="h-9 rounded-lg border-input text-foreground hover:bg-accent gap-1.5 text-xs font-medium" onClick={() => setDialogs((p) => ({ ...p, transfer: true }))}>
          <ArrowLeftRight size={14} /> Transfer
        </Button>
        <Button size="sm" variant="outline" className="h-9 rounded-lg border-input text-foreground hover:bg-accent gap-1.5 text-xs font-medium" onClick={() => { setEditing((p) => ({ ...p, budget: null })); setDialogs((p) => ({ ...p, budget: true })) }}>
          <Target size={14} /> Budget
        </Button>
        <Button size="sm" variant="ghost" className="h-9 rounded-lg text-muted-foreground hover:bg-muted gap-1.5 text-xs" onClick={handleExportExpenses}>
          <DownloadIcon size={14} /> Export
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total Saldo" value={formatCurrency(totalBalance)} loading={loading.accounts} color="text-blue-400" />
        <StatCard label="Pemasukan" value={formatCurrency(totalIncome)} loading={loading.expenses} color="text-green-400" />
        <StatCard label="Pengeluaran" value={formatCurrency(summary.total)} loading={loading.expenses} color="text-red-400" />
        <div className="rounded-xl shadow-xs border border-border bg-card p-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Budget</p>
          {loading.budgets ? <Shimmer /> : (
            <>
              <p className={cn("text-xl font-semibold tabular-nums", budgetProgress > 90 ? "text-destructive" : budgetProgress > 70 ? "text-yellow-500" : "text-foreground")}>{budgetProgress.toFixed(0)}%</p>
              <Progress value={budgetProgress} className="h-1 mt-2 bg-secondary" />
            </>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl shadow-xs border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Cashflow</p>
          <CashflowChart data={cashflowData} />
        </div>
        <div className="rounded-xl shadow-xs border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Kategori Pengeluaran</p>
          <ExpensePieChart data={categoryData} />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Accounts + Budgets */}
        <div className="lg:col-span-5 space-y-4">
          {/* Accounts */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-foreground">Akun Saldo</h2>
              <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground hover:bg-muted gap-1 min-h-0 min-w-0" onClick={() => { setEditing((p) => ({ ...p, account: null })); setDialogs((p) => ({ ...p, account: true })) }}>
                <PlusIcon size={12} /> Tambah
              </Button>
            </div>
            {loading.accounts ? <Shimmer className="h-20" /> : optimisticAccounts.length === 0 ? (
              <EmptyState emoji="🏦" text="Belum ada akun" actionLabel="Buat Akun" onAction={() => { setEditing((p) => ({ ...p, account: null })); setDialogs((p) => ({ ...p, account: true })) }} />
            ) : (
              <div className="space-y-2">
                {optimisticAccounts.map((acc) => (
                  <div key={acc.id} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/50 transition-colors shadow-xs">
                    <span className="text-xl">{ACCOUNT_TYPE_ICON[acc.type] || "💳"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate text-foreground">{acc.name}</p>
                        <Badge variant="outline" className="text-[9px] capitalize border-border text-muted-foreground h-4 min-h-0 min-w-0">{ACCOUNT_TYPE_LABEL[acc.type] || acc.type}</Badge>
                      </div>
                      <p className="text-base font-semibold tabular-nums text-primary">{formatCurrency(acc.balance)}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" title="More Actions" className="h-8 w-8 min-h-0 min-w-0 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted hover:text-foreground">
                          <MoreHorizontal size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => { setEditing((p) => ({ ...p, account: acc })); setDialogs((p) => ({ ...p, account: true })) }}><Edit size={12} /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDeleteAccount(acc.id)}><Trash2 size={12} /> Hapus</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Budgets */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-foreground">Budget</h2>
              <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground hover:bg-muted gap-1 min-h-0 min-w-0" onClick={() => { setEditing((p) => ({ ...p, budget: null })); setDialogs((p) => ({ ...p, budget: true })) }}>
                <PlusIcon size={12} /> Tambah
              </Button>
            </div>
            {loading.budgets ? <Shimmer className="h-20" /> : data.budgets.length === 0 ? (
              <EmptyState emoji="🎯" text="Belum ada budget" actionLabel="Set Budget" onAction={() => { setEditing((p) => ({ ...p, budget: null })); setDialogs((p) => ({ ...p, budget: true })) }} />
            ) : (
              <div className="space-y-2">
                {data.budgets.map((budget) => {
                  const usage = budget.limit ? Math.min((budget.spent / budget.limit) * 100, 100) : 0
                  return (
                    <div key={budget.id} className="group rounded-xl shadow-xs border border-border bg-card p-3 hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{budget.name}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">{budget.category || "Budget"}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={cn("text-[11px] font-semibold tabular-nums", usage > 90 ? "text-destructive" : usage > 70 ? "text-yellow-500" : "text-muted-foreground")}>{usage.toFixed(0)}%</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button title="More Actions" type='button' className="h-6 w-6 min-h-0 min-w-0 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted hover:text-foreground">
                                <MoreHorizontal size={14} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => { setEditing((p) => ({ ...p, budget })); setDialogs((p) => ({ ...p, budget: true })) }}><Edit size={12} /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-xs gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDeleteBudget(budget.id)}><Trash2 size={12} /> Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <Progress value={usage} className="h-1 bg-secondary mb-1.5" />
                      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                        <span>{formatCurrency(budget.spent)}</span>
                        <span>{formatCurrency(budget.limit)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right: Activity */}
        <div className="lg:col-span-7">
          <section>
            <h2 className="text-sm font-medium text-foreground mb-3">Aktivitas Terbaru</h2>
            <div className="rounded-xl shadow-xs border border-border bg-card overflow-hidden">
              {loading.expenses ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : mergedHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-2xl mb-1">📭</p>
                  <p className="text-sm text-muted-foreground">Belum ada aktivitas</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {mergedHistory.slice(0, 20).map((record) => {
                    const isIncome = record.type === "income"
                    const isTransfer = record.type === "transfer"
                    const Icon = isIncome ? ArrowUpRight : isTransfer ? ArrowLeftRight : ArrowDownRight
                    const color = isIncome ? "text-green-400 bg-green-400/10" : isTransfer ? "text-blue-400 bg-blue-400/10" : "text-red-400 bg-red-400/10"
                    const accountName = record.type === "expense" && record.accountId ? data.accounts.find((a) => a.id === record.accountId)?.name : record.accountName

                    return (
                      <li key={record.id + record.type} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", color)}>
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{record.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{new Date(record.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</span>
                            {record.category && record.category !== "transfer" && record.category !== "income" && (
                              <Badge variant="outline" className="text-[9px] capitalize border-border text-muted-foreground h-4 px-1.5 min-h-0 min-w-0">{record.category}</Badge>
                            )}
                            {accountName && <span className="text-[9px] text-muted-foreground/70">via {accountName}</span>}
                          </div>
                        </div>
                        <p className={cn("text-sm font-semibold tabular-nums shrink-0", isIncome ? "text-green-500 dark:text-green-400" : "text-destructive")}>
                          {isIncome ? "+" : "−"}{formatCurrency(record.amount)}
                        </p>
                        {record.type === "expense" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" title="more action" className="h-6 w-6 min-h-0 min-w-0 rounded flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted hover:text-foreground">
                                <MoreHorizontal size={14} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => { const exp = data.expenses.find(e => e.id === record.id); if (exp) handleEditExpense(exp) }}><Edit size={12} /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-xs gap-2 cursor-pointer text-destructive focus:bg-destructive/10" onClick={() => handleDeleteExpense(record.id)}><Trash2 size={12} /> Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Dialogs */}
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
      <TransferFormDialog isOpen={dialogs.transfer} onOpenChange={(open) => setDialogs((p) => ({ ...p, transfer: open }))} accounts={data.accounts} onSuccess={() => { fetchAccounts(); fetchTransfers(); fetchExpenses() }} />
      <AccountBalanceFormDialog isOpen={dialogs.account} onOpenChange={(open) => { setDialogs((p) => ({ ...p, account: open })); if (!open) setEditing((p) => ({ ...p, account: null })) }} fetchData={fetchAccounts} editing={editing.account} />
      <BudgetFormDialog isOpen={dialogs.budget} onOpenChange={(open) => { setDialogs((p) => ({ ...p, budget: open })); if (!open) setEditing((p) => ({ ...p, budget: null })) }} defaultMonth={filters.month} onSuccess={fetchBudgets} editing={editing.budget} />
      <IncomeFormDialog isOpen={dialogs.income} onOpenChange={(open) => setDialogs((p) => ({ ...p, income: open }))} accounts={data.accounts} defaultDate={`${filters.month}-01`} onSuccess={() => { fetchAccounts(); fetchExpenses(); fetchIncomes() }} />

      {isLoading && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="rounded-lg bg-card border border-border px-3 py-1.5 flex items-center gap-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-[11px] font-medium text-foreground">Loading...</span>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}

// ==================== SUB COMPONENTS ====================
function StatCard({ label, value, loading, color }: { label: string; value: string; loading: boolean; color: string }) {
  return (
    <div className="rounded-xl shadow-xs border border-border bg-card p-4">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      {loading ? <Shimmer /> : <p className={cn("text-xl font-semibold tabular-nums", color)}>{value}</p>}
    </div>
  )
}

function Shimmer({ className = "" }: { className?: string }) {
  return <div className={cn("animate-shimmer h-7 w-24 rounded bg-muted/50", className)} />
}

function EmptyState({ emoji, text, actionLabel, onAction }: { emoji: string; text: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs p-6 text-center">
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="text-sm text-muted-foreground mb-3">{text}</p>
      <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1 min-h-0" onClick={onAction}>
        <PlusIcon size={12} /> {actionLabel}
      </Button>
    </div>
  )
}