/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';
import { ExpenseSummaryCards } from '@/components/expenses/ExpenseSummaryCard';
import { ExpenseFilters } from '@/components/expenses/ExpenseFilter';
import { ExpenseFormDialog } from '@/components/expenses/ExpenseFormDialog';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { useExpenseForm } from '@/hooks/useExpensesForm';
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  getCategoryLabel,
  calculateExpenseSummary,
} from '@/lib/expenseUtils';

import { Expense } from '@/types/types';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

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

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      if (!res.ok) return;
      const data = await res.json();
      setAccounts(data);
    } catch (e) {
      console.error("Error fetching accounts:", e);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchAccounts();
    fetchExpenses();
  }, [fetchAccounts, fetchExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('amount', formData.amount);
      submitFormData.append('category', formData.category);
      submitFormData.append('description', formData.description);
      submitFormData.append('date', formData.date);
      submitFormData.append('accountId', formData.accountId); // 🔥 NEW

      if (formData.photo) submitFormData.append('photo', formData.photo);
      if (editingExpense && removePhoto)
        submitFormData.append('removePhoto', 'true');

      const url = editingExpense
        ? `/api/expenses/${editingExpense.id}`
        : '/api/expenses';

      const method = editingExpense ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: submitFormData });
      if (!res.ok) throw new Error('Failed to save expense');

      await fetchExpenses();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Gagal menyimpan pengeluaran');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      await fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Gagal menghapus pengeluaran');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    handleEdit(expense);
    setIsDialogOpen(true);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);

      const res = await fetch(`/api/expenses/export?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to export expenses');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pengeluaran-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting expenses:', error);
      alert('Gagal mengekspor data');
    }
  };

  const summary = calculateExpenseSummary(expenses);

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Daftar Pengeluaran
          </h1>
          <p className="text-muted-foreground">
            Kelola dan lacak pengeluaran Anda dengan foto
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2 hover:bg-green-50 hover:border-green-300"
          >
            <DownloadIcon className="h-4 w-4" />
            Export Excel
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
            accounts={accounts} // 🔥 NEW
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

      {/* List */}
      <ExpenseList
        expenses={expenses}
        loading={loading}
        onEdit={handleEditExpense}
        onDelete={handleDelete}
        formatCurrency={formatCurrency}
        getCategoryLabel={getCategoryLabel}
      />
    </div>
  );
}
