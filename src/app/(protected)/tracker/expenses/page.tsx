/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { ExpenseSummaryCards } from "@/components/expenses/ExpenseSummaryCard";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilter";
import { ExpenseFormDialog } from "@/components/expenses/ExpenseFormDialog";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { useExpenseForm } from "@/hooks/useExpensesForm";
import { TransferFormDialog } from "@/components/expenses/TransferFormDialog";
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  getCategoryLabel,
  calculateExpenseSummary,
} from "@/lib/expenseUtils";

import { Expense } from "@/types/types";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const {
    formData,
    editingExpense,
    removePhoto,
    updateFormData,
    handlePhotoChange,
    handleRemovePhoto,
    handleEdit,
    resetForm,
  } = useExpenseForm();

  // --------------------------------------------------
  // FETCH ACCOUNTS + AUTO CREATE CASH
  // --------------------------------------------------
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/account-balance");
      if (!res.ok) return;

      let data = await res.json();

      const cash = data.find((a: any) => a.type === "cash");

      if (!cash) {
        await fetch("/api/account-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Cash",
            type: "cash",
            balance: 0,
          }),
        });

        const res2 = await fetch("/api/account-balance");
        data = await res2.json();
      }

      setAccounts(data);
    } catch (e) {
      console.error("Error fetching accounts:", e);
    }
  }, []);

  // --------------------------------------------------
  // FETCH EXPENSES (NORMAL)
  // --------------------------------------------------
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory !== "all") params.append("category", filterCategory);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");

      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStartDate, filterEndDate]);

  // --------------------------------------------------
  // FETCH TRANSFERS
  // --------------------------------------------------
  const fetchTransfers = useCallback(async () => {
    try {
      const res = await fetch("/api/transfers");
      if (!res.ok) return;

      const data = await res.json();
      setTransfers(data);
    } catch (e) {
      console.error("Error fetching transfers:", e);
    }
  }, []);

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------
  useEffect(() => {
    fetchAccounts();
    fetchExpenses();
    fetchTransfers();
  }, [fetchAccounts, fetchExpenses, fetchTransfers]);

  // --------------------------------------------------
  // MERGE HISTORY (EXPENSES + TRANSFERS)
  // --------------------------------------------------
  const mergedHistory = useMemo(() => {
    const mappedExpenses = expenses.map((ex) => ({
      type: "expense",
      id: ex.id,
      title: ex.title,
      amount: ex.amount,
      category: ex.category,
      description: ex.description,
      photoUrl: ex.photoUrl,
      date: ex.date,
    }));

    const mappedTransfers = transfers.map((tr) => {
      let title = "";
      let category = "";
      const amount = tr.amount;

      if (tr.fromAccount.type !== "cash" && tr.toAccount.type === "cash") {
        title = `Tarik Tunai dari ${tr.fromAccount.name}`;
        category = "withdraw";
      } else if (tr.fromAccount.type === "cash" && tr.toAccount.type !== "cash") {
        title = `Top Up ke ${tr.toAccount.name}`;
        category = "topup";
      } else {
        title = `Transfer: ${tr.fromAccount.name} → ${tr.toAccount.name}`;
        category = "transfer";
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
      };
    });

    return [...mappedExpenses, ...mappedTransfers].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses, transfers]);

  // --------------------------------------------------
  // SUBMIT EXPENSE
  // --------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("amount", formData.amount);
      submitFormData.append("category", formData.category);
      submitFormData.append("description", formData.description);
      submitFormData.append("date", formData.date);
      submitFormData.append("accountId", formData.accountId);

      if (formData.photo) submitFormData.append("photo", formData.photo);
      if (editingExpense && removePhoto) submitFormData.append("removePhoto", "true");

      const url = editingExpense
        ? `/api/expenses/${editingExpense.id}`
        : "/api/expenses";

      const method = editingExpense ? "PUT" : "POST";

      const res = await fetch(url, { method, body: submitFormData });
      if (!res.ok) throw new Error("Failed to save expense");

      await fetchExpenses();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Gagal menyimpan pengeluaran");
    }
  };

  // --------------------------------------------------
  // DELETE EXPENSE
  // --------------------------------------------------
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengeluaran ini?")) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");

      await fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Gagal menghapus pengeluaran");
    }
  };

  const handleEditExpense = (expense: Expense) => {
    handleEdit(expense);
    setIsDialogOpen(true);
  };

  // --------------------------------------------------
  // EXPORT EXCEL
  // --------------------------------------------------
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory !== "all") params.append("category", filterCategory);
      if (filterStartDate) params.append("startDate", filterStartDate);
      if (filterEndDate) params.append("endDate", filterEndDate);

      const res = await fetch(`/api/expenses/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export expenses");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `pengeluaran-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Gagal mengekspor data");
    }
  };

  const summary = calculateExpenseSummary(expenses);

  // --------------------------------------------------
  // JSX RETURN
  // --------------------------------------------------
  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Daftar Pengeluaran
          </h1>
          <p className="text-muted-foreground">Kelola dan lacak pengeluaran Anda serta riwayat transfer.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <DownloadIcon className="h-4 w-4" /> Export Excel
          </Button>

          <Button variant="outline" onClick={() => setIsTransferOpen(true)}>
            Transfer Saldo
          </Button>

          <ExpenseFormDialog
            isOpen={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
            formData={formData}
            onFormDataChange={updateFormData}
            onSubmit={handleSubmit}
            onPhotoChange={handlePhotoChange}
            onRemovePhoto={handleRemovePhoto}
            isEditing={!!editingExpense}
            categories={EXPENSE_CATEGORIES}
            accounts={accounts}
            existingPhotoUrl={editingExpense?.photoUrl}
          />
        </div>
      </div>

      {/* Summary */}
      <ExpenseSummaryCards
        totalExpenses={summary.total}
        expensesCount={summary.count}
        averageExpense={summary.average}
        topCategory={summary.topCategory}
        formatCurrency={formatCurrency}
      />

      {/* Filters */}
      <ExpenseFilters
        filterCategory={filterCategory}
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        onCategoryChange={setFilterCategory}
        onStartDateChange={setFilterStartDate}
        onEndDateChange={setFilterEndDate}
        categories={EXPENSE_CATEGORIES}
      />

      {/* History List (Expenses + Transfers) */}
      <ExpenseList
        expenses={mergedHistory}
        loading={loading}
        onEdit={handleEditExpense}
        onDelete={handleDelete}
        formatCurrency={formatCurrency}
        getCategoryLabel={getCategoryLabel}
      />

      {/* Transfer Modal */}
      <TransferFormDialog
        isOpen={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        accounts={accounts}
        onSuccess={() => {
          fetchAccounts();
          fetchTransfers();
          fetchExpenses();
        }}
      />
    </div>
  );
}
