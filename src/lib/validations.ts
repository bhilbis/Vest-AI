import { z } from "zod";

// ==================== EXPENSE ====================
export const ExpenseSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(100),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  category: z.string().min(1, "Kategori wajib dipilih"),
  description: z.string().max(500).optional().default(""),
  date: z.string().min(1, "Tanggal wajib diisi"),
  accountId: z.string().min(1, "Akun wajib dipilih"),
  budgetId: z.string().optional().default(""),
});

export type ExpenseInput = z.infer<typeof ExpenseSchema>;

// ==================== INCOME ====================
export const IncomeSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(100),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  accountId: z.string().min(1, "Akun wajib dipilih"),
});

export type IncomeInput = z.infer<typeof IncomeSchema>;

// ==================== TRANSFER ====================
export const TransferSchema = z
  .object({
    fromAccountId: z.string().min(1, "Akun asal wajib dipilih"),
    toAccountId: z.string().min(1, "Akun tujuan wajib dipilih"),
    amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
    note: z.string().max(200).optional().default(""),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Akun asal dan tujuan tidak boleh sama",
    path: ["toAccountId"],
  });

export type TransferInput = z.infer<typeof TransferSchema>;

// ==================== BUDGET ====================
export const BudgetSchema = z.object({
  name: z.string().min(1, "Nama budget wajib diisi").max(50),
  category: z.string().optional().default(""),
  limit: z.coerce.number().positive("Limit harus lebih dari 0"),
  month: z.string().min(1, "Bulan wajib dipilih"),
  notes: z.string().max(300).optional().default(""),
});

export type BudgetInput = z.infer<typeof BudgetSchema>;

// ==================== ACCOUNT BALANCE ====================
export const AccountBalanceSchema = z.object({
  name: z.string().min(1, "Nama akun wajib diisi").max(50),
  type: z.enum(["bank", "ewallet", "cash"], {
    error: "Tipe akun tidak valid",
  }),
  balance: z.coerce.number().min(0, "Saldo tidak boleh negatif").default(0),
});

export type AccountBalanceInput = z.infer<typeof AccountBalanceSchema>;
