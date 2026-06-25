import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getExpenses } from "@/lib/services/expenseService";
import { getFinancialSummary } from "@/lib/services/financeSummary";

/**
 * Tool registry untuk financial assistant agent.
 * Lihat docs/financial-assistant-agent-blueprint.md §6 & §12.
 *
 * Fase 2 = tool read-only saja. Tiap tool:
 * - punya schema (zod) untuk validasi argumen dari model (jangan dipercaya mentah),
 * - punya risk_class + permission,
 * - selalu di-scope ke userId di server,
 * - mengembalikan hasil terstruktur { status, summary, data } dengan cap baris.
 */

export type ToolRiskClass =
  | "read_private_data"
  | "propose_write"
  | "financial_write"
  | "destructive";

export type ToolPermission = "allow" | "approval" | "deny";

export type ToolResult = {
  status: "ok" | "error" | "denied" | "needs_approval";
  summary: string;
  data?: unknown;
  ref?: string;
};

export type ToolContext = {
  userId: string;
};

/** Deskriptor parameter netral -> dikonversi ke schema tiap provider. */
type ParamSpec = {
  type: "string" | "number";
  description: string;
  required?: boolean;
  enum?: string[];
};

type ToolParams = Record<string, ParamSpec>;

export type ToolDefinition = {
  name: string;
  description: string;
  riskClass: ToolRiskClass;
  permission: ToolPermission;
  params: ToolParams;
  /** Validasi argumen model. Throw ZodError jika tidak valid. */
  schema: z.ZodTypeAny;
  /** Maksimal baris yang dikembalikan (cap konteks, blueprint §11). */
  maxRows?: number;
  execute: (args: unknown, ctx: ToolContext) => Promise<ToolResult>;
};

// ---------- Schema converters (lihat blueprint §6) ----------

/** JSON Schema gaya OpenAI/Groq (type lowercase). */
export function toOpenAISchema(params: ToolParams) {
  const properties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];
  for (const [key, spec] of Object.entries(params)) {
    properties[key] = { type: spec.type, description: spec.description };
    if (spec.enum) properties[key].enum = spec.enum;
    if (spec.required) required.push(key);
  }
  return { type: "object", properties, required };
}

/** Schema Gemini functionDeclarations (type UPPERCASE per OpenAPI proto). */
export function toGeminiSchema(params: ToolParams) {
  const properties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];
  for (const [key, spec] of Object.entries(params)) {
    properties[key] = {
      type: spec.type.toUpperCase(),
      description: spec.description,
    };
    if (spec.enum) properties[key].enum = spec.enum;
    if (spec.required) required.push(key);
  }
  return { type: "OBJECT", properties, required };
}

// ---------- Read-only tools ----------

const listExpensesSchema = z.object({
  category: z.string().min(1).optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Format month harus YYYY-MM")
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const LIST_EXPENSES_MAX = 20;

const getFinancialSummaryTool: ToolDefinition = {
  name: "get_financial_summary",
  description:
    "Ambil ringkasan finansial user: total saldo, total pengeluaran/pemasukan terkini, net cash flow, financial runway, breakdown pengeluaran per kategori, dan utilisasi budget. Gunakan untuk pertanyaan agregat/overview.",
  riskClass: "read_private_data",
  permission: "allow",
  params: {},
  schema: z.object({}),
  execute: async (_args, ctx) => {
    const summary = await getFinancialSummary(ctx.userId);
    return {
      status: "ok",
      summary: `Net cash flow ${summary.netCashFlow}, total saldo ${summary.totalBalance}.`,
      data: summary,
    };
  },
};

const listExpensesTool: ToolDefinition = {
  name: "list_expenses",
  description:
    "Daftar transaksi pengeluaran user dengan filter opsional (category, month YYYY-MM, startDate/endDate ISO). Maksimal 20 baris terbaru. Gunakan untuk pertanyaan rinci tentang pengeluaran tertentu.",
  riskClass: "read_private_data",
  permission: "allow",
  maxRows: LIST_EXPENSES_MAX,
  params: {
    category: { type: "string", description: "Filter kategori, mis. 'Makanan'." },
    month: { type: "string", description: "Filter bulan format YYYY-MM." },
    startDate: { type: "string", description: "Tanggal awal ISO (YYYY-MM-DD)." },
    endDate: { type: "string", description: "Tanggal akhir ISO (YYYY-MM-DD)." },
  },
  schema: listExpensesSchema,
  execute: async (args, ctx) => {
    const parsed = listExpensesSchema.parse(args ?? {});
    const rows = await getExpenses({
      userId: ctx.userId,
      category: parsed.category ?? null,
      monthParam: parsed.month ?? null,
      startDate: parsed.startDate ?? null,
      endDate: parsed.endDate ?? null,
    });
    const capped = rows.slice(0, LIST_EXPENSES_MAX).map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      category: e.category,
      date: e.date.toISOString().slice(0, 10),
      account: e.account?.name ?? null,
      budget: e.budget?.name ?? null,
    }));
    return {
      status: "ok",
      summary: `${capped.length} pengeluaran (dari total ${rows.length}) cocok filter.`,
      data: capped,
    };
  },
};

export const READ_TOOLS: ToolDefinition[] = [getFinancialSummaryTool, listExpensesTool];

// ---------- Propose-write tools (draft only, NO write) ----------

/**
 * Resolusi akun by id ATAU nama (case-insensitive), selalu scoped userId.
 * Argumen model tidak dipercaya: akun divalidasi milik user di server.
 */
async function resolveAccount(userId: string, account: string) {
  const accounts = await prisma.accountBalance.findMany({
    where: { userId },
    select: { id: true, name: true, balance: true },
  });
  const needle = account.trim().toLowerCase();
  const match =
    accounts.find((a) => a.id === account) ??
    accounts.find((a) => a.name.toLowerCase() === needle);
  return { match: match ?? null, available: accounts.map((a) => a.name) };
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const draftExpenseSchema = z.object({
  title: z.string().min(1).max(100),
  amount: z.coerce.number().positive(),
  account: z.string().min(1),
  category: z.string().min(1).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format date harus YYYY-MM-DD")
    .optional(),
});

const draftIncomeSchema = z.object({
  title: z.string().min(1).max(100),
  amount: z.coerce.number().positive(),
  account: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format date harus YYYY-MM-DD")
    .optional(),
});

const draftExpenseTool: ToolDefinition = {
  name: "draft_expense",
  description:
    "Buat DRAFT pencatatan pengeluaran untuk dikonfirmasi user. TIDAK menulis ke database — hanya preview. Selalu minta konfirmasi user setelahnya; jangan klaim sudah tercatat. Param: title, amount (angka), account (nama akun mis. 'BCA'), category (opsional), date (opsional YYYY-MM-DD).",
  riskClass: "propose_write",
  permission: "allow",
  params: {
    title: { type: "string", description: "Judul/keterangan pengeluaran.", required: true },
    amount: { type: "number", description: "Nominal dalam rupiah (angka).", required: true },
    account: { type: "string", description: "Nama akun sumber dana, mis. 'BCA'.", required: true },
    category: { type: "string", description: "Kategori pengeluaran (opsional)." },
    date: { type: "string", description: "Tanggal YYYY-MM-DD (opsional, default hari ini)." },
  },
  schema: draftExpenseSchema,
  execute: async (args, ctx) => {
    const parsed = draftExpenseSchema.parse(args ?? {});
    const { match, available } = await resolveAccount(ctx.userId, parsed.account);
    if (!match) {
      return {
        status: "error",
        summary: `Akun "${parsed.account}" tidak ditemukan. Akun tersedia: ${available.join(", ") || "(belum ada)"}.`,
      };
    }
    const amount = Number(parsed.amount);
    const sufficientBalance = match.balance >= amount;
    return {
      status: "needs_approval",
      summary: sufficientBalance
        ? `Draft pengeluaran "${parsed.title}" ${amount} dari ${match.name}. Tunggu konfirmasi user.`
        : `Draft pengeluaran "${parsed.title}" ${amount} dari ${match.name}, tetapi SALDO TIDAK MENCUKUPI (saldo ${match.balance}). Beri tahu user.`,
      data: {
        kind: "expense",
        title: parsed.title,
        amount,
        category: parsed.category || "Lainnya",
        accountId: match.id,
        accountName: match.name,
        date: parsed.date || todayISO(),
        currentBalance: match.balance,
        sufficientBalance,
      },
    };
  },
};

const draftIncomeTool: ToolDefinition = {
  name: "draft_income",
  description:
    "Buat DRAFT pencatatan pemasukan untuk dikonfirmasi user. TIDAK menulis ke database — hanya preview. Selalu minta konfirmasi user; jangan klaim sudah tercatat. Param: title, amount (angka), account (nama akun tujuan), date (opsional YYYY-MM-DD).",
  riskClass: "propose_write",
  permission: "allow",
  params: {
    title: { type: "string", description: "Judul/sumber pemasukan.", required: true },
    amount: { type: "number", description: "Nominal dalam rupiah (angka).", required: true },
    account: { type: "string", description: "Nama akun tujuan, mis. 'BCA'.", required: true },
    date: { type: "string", description: "Tanggal YYYY-MM-DD (opsional, default hari ini)." },
  },
  schema: draftIncomeSchema,
  execute: async (args, ctx) => {
    const parsed = draftIncomeSchema.parse(args ?? {});
    const { match, available } = await resolveAccount(ctx.userId, parsed.account);
    if (!match) {
      return {
        status: "error",
        summary: `Akun "${parsed.account}" tidak ditemukan. Akun tersedia: ${available.join(", ") || "(belum ada)"}.`,
      };
    }
    const amount = Number(parsed.amount);
    return {
      status: "needs_approval",
      summary: `Draft pemasukan "${parsed.title}" ${amount} ke ${match.name}. Tunggu konfirmasi user.`,
      data: {
        kind: "income",
        title: parsed.title,
        amount,
        accountId: match.id,
        accountName: match.name,
        date: parsed.date || todayISO(),
      },
    };
  },
};

export const DRAFT_TOOLS: ToolDefinition[] = [draftExpenseTool, draftIncomeTool];

/** Registry aktif yang diekspos ke model. `commit_*` SENGAJA tidak ada di sini —
 * commit hanya bisa lewat aksi user eksplisit (approval-gated, blueprint §12). */
export const TOOL_REGISTRY: ToolDefinition[] = [...READ_TOOLS, ...DRAFT_TOOLS];

const TOOLS_BY_NAME = new Map(TOOL_REGISTRY.map((t) => [t.name, t]));

/**
 * Eksekusi tool by name dengan validasi & guard. SELALU dipanggil di server;
 * argumen model tidak dipercaya — divalidasi via zod di dalam execute, dan
 * permission dicek di sini (deny/approval di-handle sebelum execute).
 */
export async function runTool(
  name: string,
  rawArgs: unknown,
  ctx: ToolContext,
): Promise<ToolResult> {
  const tool = TOOLS_BY_NAME.get(name);
  if (!tool) {
    return { status: "error", summary: `Tool tidak dikenal: ${name}` };
  }
  if (tool.permission === "deny") {
    return { status: "denied", summary: `Tool ${name} ditolak oleh kebijakan.` };
  }
  // Fase 2: hanya read tools (permission "allow"). Tool "approval" ditangani di
  // fase berikutnya (draft -> approve -> commit) sebelum sampai ke sini.
  try {
    return await tool.execute(rawArgs, ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown tool error";
    return { status: "error", summary: `Gagal menjalankan ${name}: ${message}` };
  }
}
