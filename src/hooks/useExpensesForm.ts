import { Expense } from '@/types/types';
import { useState } from 'react';

interface FormData {
  title: string;
  amount: string;
  category: string;
  description: string;
  date: string;
  photo: File | null;
  photoPreview: string | null;
  accountId: string; // 🔥 NEW
  budgetId: string;
}

const initialFormData: FormData = {
  title: '',
  amount: '',
  category: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  photo: null,
  photoPreview: null,
  accountId: '', // 🔥 NEW
  budgetId: '',
};

export function useExpenseForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData((prev) => ({ ...prev, photo: file }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        photoPreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, photo: null, photoPreview: null }));
    if (editingExpense) setRemovePhoto(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);

    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category || '',
      description: expense.description || '',
      date: new Date(expense.date).toISOString().split('T')[0],
      photo: null,
      photoPreview: expense.photoUrl,
      accountId: expense.accountId ?? '', // 🔥 NEW
      budgetId: expense.budgetId ?? '',
    });

    setRemovePhoto(false);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingExpense(null);
    setRemovePhoto(false);
  };

  return {
    formData,
    editingExpense,
    removePhoto,
    updateFormData,
    handlePhotoChange,
    handleRemovePhoto,
    handleEdit,
    resetForm,
  };
}