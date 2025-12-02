"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Wallet,
  ShoppingBag,
  Car,
  Utensils,
  Home,
  CreditCard,
  ArrowLeftRight,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react"

import { ExpenseSummaryCards } from "@/components/expenses/ExpenseSummaryCard"
import { ExpenseFilters } from "@/components/expenses/ExpenseFilter"
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog"
import { useExpenseForm } from "@/hooks/useExpensesForm"
import { TransferFormDialog } from "@/components/expenses/TransferFormDialog"
import { AccountBalanceFormDialog } from "@/components/balance-type/BalanceTypeFormDialog"

import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  calculateExpenseSummary,
} from "@/lib/expenseUtils"

import { Expense } from "@/types/types"

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
  category: string
  description: string
  photoUrl: string | null
  date: string
  accountId?: string
  sourceAccountName?: string
}

export default function FinancialOverviewPage() {
  // --------------------------------------------------
  // STATE
  // --------------------------------------------------
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transfers, setTransfers] = useState<any[]>([])
  const [accounts, setAccounts] = useState<AccountBalance[]>([])

  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountBalance | null>(null)

  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")

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

  // --------------------------------------------------
  // FETCH ACCOUNTS (SHARED) + AUTO CREATE CASH
  // --------------------------------------------------
  const fetchAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true)
      const res = await fetch("/api/account-balance")
      if (!res.ok) return

      let data = await res.json()

      const cash = data.find((a: any) => a.type === "cash")

      if (!cash) {
        await fetch("/api/account-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Cash",
            type: "cash",
            balance: 0,
          }),
        })

        const res2 = await fetch("/api/account-balance")
        data = await res2.json()
      }

      setAccounts(data)
    } catch (e) {
      console.error("Error fetching accounts:", e)
    } finally {
      setLoadingAccounts(false)
    }
  }, [])

  // --------------------------------------------------
  // FETCH EXPENSES
  // --------------------------------------------------
  const fetchExpenses = useCallback(async () => {
    try {
      setLoadingExpenses(true)
      const params = new URLSearchParams()
      if (filterCategory !== "all") params.append("category", filterCategory)
      if (filterStartDate) params.append("startDate", filterStartDate)
      if (filterEndDate) params.append("endDate", filterEndDate)

      const res = await fetch(`/api/expenses?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch expenses")

      const data = await res.json()
      setExpenses(data)
    } catch (error) {
      console.error("Error fetching expenses:", error)
    } finally {
      setLoadingExpenses(false)
    }
  }, [filterCategory, filterStartDate, filterEndDate])

  // --------------------------------------------------
  // FETCH TRANSFERS
  // --------------------------------------------------
  const fetchTransfers = useCallback(async () => {
    try {
      const res = await fetch("/api/transfers")
      if (!res.ok) return

      const data = await res.json()
      setTransfers(data)
    } catch (e) {
      console.error("Error fetching transfers:", e)
    }
  }, [])

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------
  useEffect(() => {
    fetchAccounts()
    fetchExpenses()
    fetchTransfers()
  }, [fetchAccounts, fetchExpenses, fetchTransfers])

  // --------------------------------------------------
  // MERGED HISTORY
  // --------------------------------------------------
  const mergedHistory: MergedRecord[] = useMemo(() => {
    const mappedExpenses: MergedRecord[] = expenses.map((ex) => ({
      type: "expense",
      id: ex.id,
      title: ex.title,
      amount: ex.amount,
      category: ex.category,
      description: ex.description,
      photoUrl: ex.photoUrl,
      date: ex.date,
      // used later to resolve "via {Account}"
      accountId: ex.accountId,
    }))

    const mappedTransfers: MergedRecord[] = transfers.map((tr) => {
      let title = ""
      let category = ""
      const amount = tr.amount

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
        amount,
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
  }, [expenses, transfers])

  // --------------------------------------------------
  // EXPENSE HANDLERS
  // --------------------------------------------------
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const submitFormData = new FormData()
      submitFormData.append("title", formData.title)
      submitFormData.append("amount", formData.amount)
      submitFormData.append("category", formData.category)
      submitFormData.append("description", formData.description)
      submitFormData.append("date", formData.date)
      submitFormData.append("accountId", formData.accountId)

      if (formData.photo) submitFormData.append("photo", formData.photo)
      if (editingExpense && removePhoto) submitFormData.append("removePhoto", "true")

      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses"
      const method = editingExpense ? "PUT" : "POST"

      const res = await fetch(url, { method, body: submitFormData })
      if (!res.ok) throw new Error("Failed to save expense")

      await fetchExpenses()
      resetForm()
      setIsExpenseDialogOpen(false)
    } catch (error) {
      console.error("Error saving expense:", error)
      alert("Gagal menyimpan pengeluaran")
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Hapus pengeluaran ini?")) return

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete expense")

      await fetchExpenses()
    } catch (error) {
      console.error("Error deleting expense:", error)
      alert("Gagal menghapus pengeluaran")
    }
  }

  const handleEditExpense = (expense: Expense) => {
    handleEdit(expense)
    setIsExpenseDialogOpen(true)
  }

  const handleExportExpenses = async () => {
    try {
      const params = new URLSearchParams()
      if (filterCategory !== "all") params.append("category", filterCategory)
      if (filterStartDate) params.append("startDate", filterStartDate)
      if (filterEndDate) params.append("endDate", filterEndDate)

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
  }

  // --------------------------------------------------
  // ACCOUNT HANDLERS
  // --------------------------------------------------
  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Hapus akun saldo ini?")) return

    try {
      const res = await fetch(`/api/account-balance/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete account")

      await fetchAccounts()
    } catch (error) {
      console.error("Error deleting account:", error)
      alert("Gagal menghapus akun saldo")
    }
  }

  const summary = calculateExpenseSummary(expenses)

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------
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

  // --------------------------------------------------
  // JSX
  // --------------------------------------------------
  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-10 bg-background text-foreground">
      {/* HEADER */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Financial Overview
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Satu tempat untuk melihat akun saldo, ringkasan pengeluaran, dan aktivitas keuangan terbaru Anda.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
          Data pengeluaran dan akun diperbarui otomatis.
        </div>
      </header>

      {/* SECTION A: MY ACCOUNTS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">My Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Kelola semua akun saldo Anda sebagai dompet digital, bank, dan cash.
            </p>
          </div>
        </div>

        {loadingAccounts ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : accounts.length === 0 ? (
          <Card className="border border-dashed border-border bg-card shadow-sm">
            <CardContent className="py-10 text-center space-y-4">
              <p className="text-muted-foreground">Belum ada akun saldo.</p>
              <Button
                onClick={() => {
                  setEditingAccount(null)
                  setIsAccountFormOpen(true)
                }}
                className="gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Tambah Akun Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.map((acc) => (
              <Card
                key={acc.id}
                className="relative overflow-hidden border border-border bg-card shadow-sm"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-base">{acc.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Dibuat {new Date(acc.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {acc.type && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {acc.type === "cash"
                            ? "Cash"
                            : acc.type === "bank"
                            ? "Bank"
                            : acc.type === "ewallet"
                            ? "E-Wallet"
                            : acc.type}
                        </Badge>
                      )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => {
                            setEditingAccount(acc)
                            setIsAccountFormOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => handleDeleteAccount(acc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-1">Saldo</p>
                    <p className="text-2xl md:text-3xl font-semibold tabular-nums">
                      {formatCurrency(acc.balance)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Plus Card */}
            <button
              type="button"
              onClick={() => {
                setEditingAccount(null)
                setIsAccountFormOpen(true)
              }}
              className="flex h-full min-h-[140px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/40 text-muted-foreground transition hover:border-primary/60 hover:bg-primary/5"
            >
              <div className="flex flex-col items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <PlusIcon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">Tambah Akun</span>
              </div>
            </button>
          </div>
        )}

        <AccountBalanceFormDialog
          isOpen={isAccountFormOpen}
          onOpenChange={setIsAccountFormOpen}
          fetchData={fetchAccounts}
          editing={editingAccount}
        />
      </section>

      {/* SECTION B: EXPENSE SUMMARY */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Expense Summary</h2>
            <p className="text-sm text-muted-foreground">
              Lihat gambaran besar pengeluaran dan kategori teratas Anda.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              className="gap-2"
              onClick={() => {
                setIsExpenseDialogOpen(true)
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Tambah Pengeluaran
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsTransferOpen(true)}
            >
              Transfer Saldo
            </Button>

            <Button
              variant="secondary"
              className="gap-2"
              onClick={handleExportExpenses}
            >
              <DownloadIcon className="h-4 w-4" />
              Export
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
          isOpen={isExpenseDialogOpen}
          onOpenChange={(open) => {
            setIsExpenseDialogOpen(open)
            if (!open) resetForm()
          }}
          formData={formData}
          onFormDataChange={updateFormData}
          onSubmit={handleSubmitExpense}
          onPhotoChange={handlePhotoChange}
          onRemovePhoto={handleRemovePhoto}
          isEditing={!!editingExpense}
          categories={EXPENSE_CATEGORIES}
          accounts={accounts}
          existingPhotoUrl={editingExpense?.photoUrl}
        />
      </section>

      {/* SECTION C: RECENT ACTIVITY */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">
            Riwayat pengeluaran dan transfer terbaru Anda dalam satu list.
          </p>
        </div>

        <ExpenseFilters
          filterCategory={filterCategory}
          filterStartDate={filterStartDate}
          filterEndDate={filterEndDate}
          onCategoryChange={setFilterCategory}
          onStartDateChange={setFilterStartDate}
          onEndDateChange={setFilterEndDate}
          categories={EXPENSE_CATEGORIES}
        />

        <Card className="bg-card text-card-foreground border border-border rounded-xl shadow-sm">
          <CardContent className="p-0">
            {loadingExpenses ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memuat riwayat transaksi...
              </div>
            ) : mergedHistory.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Belum ada aktivitas terbaru.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {mergedHistory.map((record) => {
                  const Icon = getRecordIcon(record)
                  const isNegative =
                    record.type === "expense" ||
                    (record.type === "transfer" && record.category !== "topup")

                  const accountNameFromExpense =
                    record.type === "expense" && record.accountId
                      ? accounts.find((a) => a.id === record.accountId)?.name
                      : undefined

                  const sourceAccountName =
                    accountNameFromExpense || record.sourceAccountName

                  return (
                    <li
                      key={record.id + record.type}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <p className="text-sm font-medium">{record.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.date).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {record.category || "Lainnya"}
                          </Badge>
                          {sourceAccountName && (
                            <Badge className="bg-primary/10 text-primary text-xs">
                              via {sourceAccountName}
                            </Badge>
                          )}
                          {record.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {record.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold tabular-nums ${
                            isNegative ? "text-destructive" : "text-primary"
                          }`}
                        >
                          {formatCurrency(record.amount)}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* TRANSFER MODAL */}
      <TransferFormDialog
        isOpen={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        accounts={accounts}
        onSuccess={() => {
          fetchAccounts()
          fetchTransfers()
          fetchExpenses()
        }}
      />
    </div>
  )
}


