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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  DownloadIcon,
  Loader2,
  MoreHorizontal,
  PlusIcon,
  Trash2,
  Edit,
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
} from "lucide-react"

import { ExpenseSummaryCards } from "@/components/expenses/ExpenseSummaryCard"
import { ExpenseFilters } from "@/components/expenses/ExpenseFilter"
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog"
import { useExpenseForm } from "@/hooks/useExpensesForm"
import { TransferFormDialog } from "@/components/expenses/TransferFormDialog"
import { AccountBalanceFormDialog } from "@/components/balance-type/BalanceTypeFormDialog"
import { BudgetFormDialog } from "@/components/budgets/BudgetFormDialog"

import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  calculateExpenseSummary,
} from "@/lib/expenseUtils"

import { Budget, Expense } from "@/types/types"

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

const ACCOUNT_TYPE_COLORS = {
  cash: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  bank: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  ewallet: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
} as const

// ==================== UTILITY FUNCTIONS ====================
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
  return new Date(year, month - 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  })
}

// ==================== MAIN COMPONENT ====================
export default function FinancialOverviewPage() {
  // State Management - Grouped by concern
  const [data, setData] = useState({
    expenses: [] as Expense[],
    transfers: [] as any[],
    accounts: [] as AccountBalance[],
    budgets: [] as BudgetWithUsage[],
  })

  const [loading, setLoading] = useState({
    expenses: true,
    accounts: true,
    budgets: true,
  })

  const [dialogs, setDialogs] = useState({
    expense: false,
    transfer: false,
    account: false,
    budget: false,
  })

  const [editing, setEditing] = useState<{
    account: AccountBalance | null
    budget: BudgetWithUsage | null
  }>({
    account: null,
    budget: null,
  })

  const [filters, setFilters] = useState({
    category: "all",
    startDate: "",
    endDate: "",
    budgetMonth: new Date().toISOString().slice(0, 7),
  })

  const [activeTab, setActiveTab] = useState<"overview" | "expenses">(
    typeof window !== "undefined" && window.innerWidth < 768
      ? "expenses"
      : "overview"
  )

  const {
    formData,
    editingExpense,
    removePhoto,
    updateFormData,
    handlePhotoChange,
    handleRemovePhoto,
    handleEdit,
    resetForm,
  } = useExpenseForm()

  // ==================== COMPUTED VALUES ====================
  const expenseMonthKey = useMemo(
    () => formData.date ? formData.date.slice(0, 7) : new Date().toISOString().slice(0, 7),
    [formData.date]
  )

  const budgetsForExpense = useMemo(
    () => data.budgets.filter((budget) => budget.monthKey === expenseMonthKey),
    [data.budgets, expenseMonthKey]
  )

  const mergedHistory = useMemo(() => {
    const mappedExpenses: MergedRecord[] = data.expenses.map((ex) => ({
      type: "expense",
      id: ex.id,
      title: ex.title,
      amount: ex.amount,
      category: ex.category || "",
      description: ex.description || "",
      photoUrl: ex.photoUrl,
      date: ex.date,
      accountId: ex.accountId,
      budgetName: ex.budget?.name ?? null,
    }))

    const mappedTransfers: MergedRecord[] = data.transfers.map((tr) => {
      let title = ""
      let category = ""

      if (tr.fromAccount.type !== "cash" && tr.toAccount.type === "cash") {
        title = `Tarik Tunai dari ${tr.fromAccount.name}`
        category = "withdraw"
      } else if (tr.fromAccount.type === "cash" && tr.toAccount.type !== "cash") {
        title = `Top Up ke ${tr.toAccount.name}`
        category = "topup"
      } else {
        title = `Transfer: ${tr.fromAccount.name} → ${tr.toAccount.name}`
        category = "transfer"
      }

      return {
        type: "transfer",
        id: tr.id,
        title,
        amount: tr.amount,
        category,
        description: tr.note ?? "",
        photoUrl: null,
        date: tr.date,
        sourceAccountName: tr.fromAccount?.name,
      }
    })

    return [...mappedExpenses, ...mappedTransfers].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [data.expenses, data.transfers])

  const summary = useMemo(() => calculateExpenseSummary(data.expenses), [data.expenses])

  const budgetTotals = useMemo(
    () =>
      data.budgets.reduce(
        (acc, budget) => {
          acc.limit += budget.limit
          acc.spent += budget.spent
          return acc
        },
        { limit: 0, spent: 0 }
      ),
    [data.budgets]
  )

  const budgetProgress = budgetTotals.limit
    ? Math.min((budgetTotals.spent / budgetTotals.limit) * 100, 100)
    : 0

  // ==================== DATA FETCHING ====================
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, accounts: true }))
      const res = await fetch("/api/account-balance")
      if (!res.ok) return

      let fetchedData = await res.json()
      const cash = fetchedData.find((a: any) => a.type === "cash")

      if (!cash) {
        await fetch("/api/account-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Cash", type: "cash", balance: 0 }),
        })

        const res2 = await fetch("/api/account-balance")
        fetchedData = await res2.json()
      }

      setData((prev) => ({ ...prev, accounts: fetchedData }))
    } catch (e) {
      console.error("Error fetching accounts:", e)
    } finally {
      setLoading((prev) => ({ ...prev, accounts: false }))
    }
  }, [])

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, expenses: true }))
      const params = new URLSearchParams()
      if (filters.category !== "all") params.append("category", filters.category)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const res = await fetch(`/api/expenses?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch expenses")

      const fetchedData = await res.json()
      setData((prev) => ({ ...prev, expenses: fetchedData }))
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoading((prev) => ({ ...prev, expenses: false }))
    }
  }, [filters.category, filters.startDate, filters.endDate])

  const fetchTransfers = useCallback(async () => {
    try {
      const res = await fetch("/api/transfers")
      if (!res.ok) return

      const fetchedData = await res.json()
      setData((prev) => ({ ...prev, transfers: fetchedData }))
    } catch (e) {
      console.error("Error fetching transfers:", e)
    }
  }, [])

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, budgets: true }))
      const res = await fetch(`/api/budgets?month=${filters.budgetMonth}`)
      if (!res.ok) throw new Error("Failed to fetch budgets")

      const fetchedData = await res.json()
      const normalized = (fetchedData.budgets ?? []).map((budget: any) => {
        const spent = Number(budget.spent ?? 0)
        const remaining = Number(budget.remaining ?? Math.max(budget.limit - spent, 0))
        const monthKey = budget.monthKey
          ? budget.monthKey
          : typeof budget.month === "string"
          ? budget.month.slice(0, 7)
          : new Date(budget.month).toISOString().slice(0, 7)

        return { ...budget, spent, remaining, monthKey } as BudgetWithUsage
      })

      setData((prev) => ({ ...prev, budgets: normalized }))
    } catch (error) {
      console.error("Error fetching budgets:", error)
    } finally {
      setLoading((prev) => ({ ...prev, budgets: false }))
    }
  }, [filters.budgetMonth])

  useEffect(() => {
    fetchAccounts()
    fetchExpenses()
    fetchTransfers()
    fetchBudgets()
  }, [fetchAccounts, fetchExpenses, fetchTransfers, fetchBudgets])

  // ==================== EVENT HANDLERS ====================
  const handleSubmitExpense = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const submitFormData = new FormData()
      submitFormData.append("title", formData.title)
      submitFormData.append("amount", formData.amount)
      submitFormData.append("category", formData.category)
      submitFormData.append("description", formData.description)
      submitFormData.append("date", formData.date)
      submitFormData.append("accountId", formData.accountId)
      submitFormData.append("budgetId", formData.budgetId || "")

      if (formData.photo) submitFormData.append("photo", formData.photo)
      if (editingExpense && removePhoto) submitFormData.append("removePhoto", "true")

      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses"
      const method = editingExpense ? "PUT" : "POST"

      const res = await fetch(url, { method, body: submitFormData })
      if (!res.ok) throw new Error("Failed to save expense")

      await Promise.all([fetchExpenses(), fetchBudgets()])
      resetForm()
      setDialogs((prev) => ({ ...prev, expense: false }))
    } catch (error) {
      console.error("Error saving expense:", error)
      alert("Gagal menyimpan pengeluaran")
    }
  }, [formData, editingExpense, removePhoto, fetchExpenses, fetchBudgets, resetForm])

  const handleDeleteExpense = useCallback(async (id: string) => {
    if (!confirm("Hapus pengeluaran ini?")) return

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete expense")

      await Promise.all([fetchExpenses(), fetchBudgets()])
    } catch (error) {
      console.error("Error deleting expense:", error)
      alert("Gagal menghapus pengeluaran")
    }
  }, [fetchExpenses, fetchBudgets])

  const handleEditExpense = useCallback((expense: Expense) => {
    handleEdit(expense)
    setDialogs((prev) => ({ ...prev, expense: true }))
  }, [handleEdit])

  const handleExportExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filters.category !== "all") params.append("category", filters.category)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const res = await fetch(`/api/expenses/export?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to export expenses")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `pengeluaran-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting:", error)
      alert("Gagal mengekspor data")
    }
  }, [filters.category, filters.startDate, filters.endDate])

  const handleDeleteAccount = useCallback(async (id: string) => {
    if (!confirm("Hapus akun saldo ini?")) return

    try {
      const res = await fetch(`/api/account-balance/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete account")

      await fetchAccounts()
    } catch (error) {
      console.error("Error deleting account:", error)
      alert("Gagal menghapus akun saldo")
    }
  }, [fetchAccounts])

  const handleDeleteBudget = useCallback(async (id: string) => {
    if (!confirm("Hapus budget ini?")) return

    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete budget")

      await fetchBudgets()
    } catch (error) {
      console.error("Error deleting budget:", error)
      alert("Gagal menghapus budget")
    }
  }, [fetchBudgets])

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto w-full max-w-screen-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-8 lg:space-y-10">
        
        {/* ==================== HEADER ==================== */}
        <header className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-linear-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Financial Overview
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                Kelola keuangan Anda dengan mudah - pantau saldo, budget, dan pengeluaran dalam satu dashboard terpadu.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm px-3 py-2 rounded-full border border-slate-200 dark:border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="hidden sm:inline">Data diperbarui real-time</span>
              <span className="sm:hidden">Live</span>
            </div>
          </div>
        </header>

        {/* ==================== TAB INTERFACE ==================== */}
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as "expenses" | "overview")} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex h-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200 dark:border-slate-800 p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-linear-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300 px-4 py-2.5 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="budgets" 
              className="data-[state=active]:bg-linear-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 px-4 py-2.5 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                <span className="hidden sm:inline">Budgets</span>
                <span className="sm:hidden">Budget</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="expenses" 
              className="data-[state=active]:bg-linear-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300 px-4 py-2.5 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Pengeluaran</span>
                <span className="sm:hidden">Expenses</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-linear-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all duration-300 px-4 py-2.5 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Aktivitas</span>
                <span className="sm:hidden">Activity</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* ==================== OVERVIEW TAB ==================== */}
          <TabsContent value="overview" className="space-y-8 animate-in fade-in-50 duration-300">
            {/* MY ACCOUNTS SECTION */}
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    My Accounts
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Kelola semua akun saldo Anda dalam satu tempat
                  </p>
                </div>
              </div>

              {loading.accounts ? (
                <div className="flex justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-muted-foreground">Memuat akun...</p>
                  </div>
                </div>
              ) : data.accounts.length === 0 ? (
                <Card className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                  <CardContent className="py-12 sm:py-16 text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <Wallet className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-medium">Belum ada akun saldo</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Tambahkan akun pertama Anda untuk mulai melacak keuangan
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setEditing((prev) => ({ ...prev, account: null }))
                        setDialogs((prev) => ({ ...prev, account: true }))
                      }}
                      className="gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Tambah Akun Pertama
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.accounts.map((acc) => (
                    <Card
                      key={acc.id}
                      className="group relative overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
                    >
                      <CardContent className="p-5 sm:p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 space-y-1">
                            <h3 className="font-semibold text-base sm:text-lg truncate">{acc.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(acc.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {acc.type && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs capitalize shrink-0 ${
                                  ACCOUNT_TYPE_COLORS[acc.type as keyof typeof ACCOUNT_TYPE_COLORS] || 
                                  "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {ACCOUNT_TYPE_LABELS[acc.type as keyof typeof ACCOUNT_TYPE_LABELS] || acc.type}
                              </Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer"
                                  onClick={() => {
                                    setEditing((prev) => ({ ...prev, account: acc }))
                                    setDialogs((prev) => ({ ...prev, account: true }))
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                  onClick={() => handleDeleteAccount(acc.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="pt-2 space-y-1">
                          <p className="text-xs text-muted-foreground">Saldo Saat Ini</p>
                          <p className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {formatCurrency(acc.balance)}
                          </p>
                        </div>
                      </CardContent>
                      
                      <div className="absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Card>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setEditing((prev) => ({ ...prev, account: null }))
                      setDialogs((prev) => ({ ...prev, account: true }))
                    }}
                    className="group flex h-full min-h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-300"
                  >
                    <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-blue-600 transition-colors">
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <PlusIcon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium">Tambah Akun</span>
                    </div>
                  </button>
                </div>
              )}

              <AccountBalanceFormDialog
                isOpen={dialogs.account}
                onOpenChange={(open) => {
                  setDialogs((prev) => ({ ...prev, account: open }))
                  if (!open) setEditing((prev) => ({ ...prev, account: null }))
                }}
                fetchData={fetchAccounts}
                editing={editing.account}
              />
            </section>

            {/* QUICK STATS SECTION */}
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  Quick Stats
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Ringkasan cepat keuangan Anda
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardContent className="p-5">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Balance</p>
                      <p className="text-2xl font-bold tabular-nums text-green-600">
                        {formatCurrency(data.accounts.reduce((sum, acc) => sum + acc.balance, 0))}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardContent className="p-5">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">This Month&apos;s Spending</p>
                      <p className="text-2xl font-bold tabular-nums text-red-600">
                        {formatCurrency(summary.total)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardContent className="p-5">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Active Budgets</p>
                      <p className="text-2xl font-bold tabular-nums text-blue-600">
                        {data.budgets.length}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                  <CardContent className="p-5">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Recent Transactions</p>
                      <p className="text-2xl font-bold tabular-nums text-purple-600">
                        {mergedHistory.slice(0, 10).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* ==================== BUDGETS TAB ==================== */}
          <TabsContent value="budgets" className="space-y-6 animate-in fade-in-50 duration-300">
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <PieChart className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    Monthly Budgets
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Tetapkan dan pantau limit pengeluaran per kategori
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 py-2 text-sm">
                    <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      type="month"
                      value={filters.budgetMonth}
                      onChange={(e) => {
                        if (e.target.value) {
                          setFilters((prev) => ({ ...prev, budgetMonth: e.target.value }))
                        }
                      }}
                      className="w-28 sm:w-32 border-0 p-0 text-sm focus-visible:ring-0 bg-transparent"
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="gap-2 border-purple-200 hover:bg-purple-50 dark:border-purple-900 dark:hover:bg-purple-950/20"
                    onClick={() => {
                      setEditing((prev) => ({ ...prev, budget: null }))
                      setDialogs((prev) => ({ ...prev, budget: true }))
                    }}
                  >
                    <PieChart className="h-4 w-4" />
                    <span className="hidden sm:inline">Set Budget</span>
                    <span className="sm:hidden">Budget</span>
                  </Button>
                </div>
              </div>

              {loading.budgets ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    <p className="text-sm text-muted-foreground">Memuat budget...</p>
                  </div>
                </div>
              ) : data.budgets.length === 0 ? (
                <Card className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                  <CardContent className="py-12 sm:py-16 text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                        <PieChart className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-medium">Belum ada budget bulan ini</p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Buat budget untuk mengontrol pengeluaran Anda
                      </p>
                    </div>
                    <Button
                      className="gap-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      onClick={() => {
                        setEditing((prev) => ({ ...prev, budget: null }))
                        setDialogs((prev) => ({ ...prev, budget: true }))
                      }}
                    >
                      <PlusIcon className="h-4 w-4" />
                      Set Budget Pertama
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="relative overflow-hidden border border-purple-200 dark:border-purple-900 bg-linear-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-purple-950/20">
                    <CardContent className="p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-400 font-medium">
                            {formatMonthLabel(filters.budgetMonth)}
                          </p>
                          <h3 className="text-xl sm:text-2xl font-bold">Progress Budget Bulanan</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {formatCurrency(budgetTotals.spent)} dari {formatCurrency(budgetTotals.limit)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl sm:text-3xl font-bold tabular-nums">
                              {budgetProgress.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Terpakai</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Progress 
                          value={budgetProgress} 
                          className="h-3 bg-purple-100 dark:bg-purple-950/50"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Sisa: {formatCurrency(Math.max(budgetTotals.limit - budgetTotals.spent, 0))}</span>
                          <span className={budgetProgress > 90 ? "text-red-600 font-medium" : ""}>
                            {budgetProgress > 100 ? "Over Budget!" : budgetProgress > 90 ? "Hampir Habis" : "On Track"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.budgets.map((budget) => {
                      const usage = budget.limit ? Math.min((budget.spent / budget.limit) * 100, 100) : 0
                      const isWarning = usage > 80
                      const isDanger = usage > 100

                      return (
                        <Card 
                          key={budget.id} 
                          className={`group relative overflow-hidden border ${
                            isDanger 
                              ? "border-red-200 dark:border-red-900" 
                              : isWarning 
                              ? "border-amber-200 dark:border-amber-900" 
                              : "border-slate-200 dark:border-slate-800"
                          } bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300`}
                        >
                          <CardContent className="p-5 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-xs text-muted-foreground capitalize truncate">
                                  {budget.category || "Budget"}
                                </p>
                                <h3 className="text-base sm:text-lg font-semibold truncate">
                                  {budget.name}
                                </h3>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer"
                                    onClick={() => {
                                      setEditing((prev) => ({ ...prev, budget }))
                                      setDialogs((prev) => ({ ...prev, budget: true }))
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                    onClick={() => handleDeleteBudget(budget.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Terpakai</span>
                                <span className={`font-semibold tabular-nums ${
                                  isDanger ? "text-red-600" : isWarning ? "text-amber-600" : ""
                                }`}>
                                  {formatCurrency(budget.spent)}
                                </span>
                              </div>
                              <Progress 
                                value={usage} 
                                className={`h-2 ${
                                  isDanger 
                                    ? "bg-red-100 dark:bg-red-950/50" 
                                    : isWarning 
                                    ? "bg-amber-100 dark:bg-amber-950/50" 
                                    : "bg-slate-100 dark:bg-slate-800"
                                }`}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Sisa: {formatCurrency(Math.max(budget.remaining, 0))}</span>
                                <span>Limit: {formatCurrency(budget.limit)}</span>
                              </div>
                            </div>

                            {budget.notes && (
                              <p className="text-xs text-muted-foreground border-t border-slate-200 dark:border-slate-800 pt-3 line-clamp-2">
                                {budget.notes}
                              </p>
                            )}
                          </CardContent>

                          {(isWarning || isDanger) && (
                            <div className={`absolute top-2 right-2 h-2 w-2 rounded-full ${
                              isDanger ? "bg-red-500" : "bg-amber-500"
                            } animate-pulse`} />
                          )}
                        </Card>
                      )
                    })}
                  </div>
                </>
              )}

              <BudgetFormDialog
                isOpen={dialogs.budget}
                onOpenChange={(open) => {
                  setDialogs((prev) => ({ ...prev, budget: open }))
                  if (!open) setEditing((prev) => ({ ...prev, budget: null }))
                }}
                defaultMonth={filters.budgetMonth}
                onSuccess={fetchBudgets}
                editing={editing.budget}
              />
            </section>
          </TabsContent>

          {/* ==================== EXPENSES TAB ==================== */}
          <TabsContent value="expenses" className="space-y-6 animate-in fade-in-50 duration-300">
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    Expense Summary
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Ringkasan dan statistik pengeluaran Anda
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    className="gap-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    onClick={() => setDialogs((prev) => ({ ...prev, expense: true }))}
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Tambah Pengeluaran</span>
                    <span className="sm:hidden">Tambah</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => setDialogs((prev) => ({ ...prev, transfer: true }))}
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    <span className="hidden sm:inline">Transfer Saldo</span>
                    <span className="sm:hidden">Transfer</span>
                  </Button>

                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={handleExportExpenses}
                  >
                    <DownloadIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
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

              <ExpenseFormDialog
                isOpen={dialogs.expense}
                onOpenChange={(open) => {
                  setDialogs((prev) => ({ ...prev, expense: open }))
                  if (!open) resetForm()
                }}
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
            </section>
          </TabsContent>

          {/* ==================== ACTIVITY TAB ==================== */}
          <TabsContent value="activity" className="space-y-6 animate-in fade-in-50 duration-300">
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  Recent Activity
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Riwayat transaksi dan pengeluaran terbaru
                </p>
              </div>

              <ExpenseFilters
                filterCategory={filters.category}
                filterStartDate={filters.startDate}
                filterEndDate={filters.endDate}
                onCategoryChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                onStartDateChange={(value) => setFilters((prev) => ({ ...prev, startDate: value }))}
                onEndDateChange={(value) => setFilters((prev) => ({ ...prev, endDate: value }))}
                categories={EXPENSE_CATEGORIES}
              />

              <Card className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  {loading.expenses ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        <p className="text-sm text-muted-foreground">Memuat riwayat...</p>
                      </div>
                    </div>
                  ) : mergedHistory.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Activity className="h-8 w-8 text-slate-400" />
                        </div>
                      </div>
                      <p className="text-base font-medium mb-1">Belum ada aktivitas</p>
                      <p className="text-sm text-muted-foreground">
                        Transaksi Anda akan muncul di sini
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                      {mergedHistory.map((record) => {
                        const Icon = getRecordIcon(record)
                        const isNegative =
                          record.type === "expense" ||
                          (record.type === "transfer" && record.category !== "topup")

                        const accountNameFromExpense =
                          record.type === "expense" && record.accountId
                            ? data.accounts.find((a) => a.id === record.accountId)?.name
                            : undefined

                        const sourceAccountName = accountNameFromExpense || record.sourceAccountName

                        return (
                          <li
                            key={record.id + record.type}
                            className="flex items-center gap-3 sm:gap-4 px-4 py-3 sm:py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                              record.type === "transfer"
                                ? "bg-blue-100 dark:bg-blue-900/20 text-blue-600"
                                : "bg-purple-100 dark:bg-purple-900/20 text-purple-600"
                            } group-hover:scale-110 transition-transform`}>
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <p className="text-sm font-medium truncate pr-2">{record.title}</p>
                                <p className="text-xs text-muted-foreground shrink-0">
                                  {new Date(record.date).toLocaleDateString("id-ID", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {record.category || "Lainnya"}
                                </Badge>
                                {sourceAccountName && (
                                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-xs border-0">
                                    via {sourceAccountName}
                                  </Badge>
                                )}
                                {record.budgetName && (
                                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 text-xs border-0">
                                    {record.budgetName}
                                  </Badge>
                                )}
                              </div>

                              {record.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {record.description}
                                </p>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <p
                                className={`text-sm sm:text-base font-bold tabular-nums ${
                                  isNegative 
                                    ? "text-red-600 dark:text-red-500" 
                                    : "text-green-600 dark:text-green-500"
                                }`}
                              >
                                {isNegative ? "−" : "+"}{formatCurrency(record.amount)}
                              </p>
                            </div>

                            {record.type === "expense" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer"
                                    onClick={() => {
                                      const expense = data.expenses.find(e => e.id === record.id)
                                      if (expense) handleEditExpense(expense)
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                    onClick={() => handleDeleteExpense(record.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>
          </TabsContent>
        </Tabs>

        {/* ==================== TRANSFER MODAL ==================== */}
        <TransferFormDialog
          isOpen={dialogs.transfer}
          onOpenChange={(open) => setDialogs((prev) => ({ ...prev, transfer: open }))}
          accounts={data.accounts}
          onSuccess={() => {
            fetchAccounts()
            fetchTransfers()
            fetchExpenses()
          }}
        />
      </div>
    </div>
  )
}