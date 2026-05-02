/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GoogleGenAI } from "@google/genai"
import Groq from "groq-sdk"

let _googleAi: GoogleGenAI | null = null
let _groq: Groq | null = null

function getGoogleAi() {
  if (!_googleAi) _googleAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" })
  return _googleAi
}

function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" })
  return _groq
}

const DAILY_LIMIT = 20
const WINDOW_MS = 24 * 60 * 60 * 1000
const HISTORY_WINDOW = 10
const LOW_POWER_THRESHOLD = 0.8

const usageMap = new Map<string, { count: number; resetAt: number }>()

import { AI_MODELS } from "../data"
const allowedModels = Object.keys(AI_MODELS)

const limitNumber = (value: number, decimals = 2) =>
  Number.isFinite(value) ? Number(value.toFixed(decimals)) : 0

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)

async function buildUserContext(userId: string) {
  const [assets, balances, expenses, incomes, budgets, transfers, semestersResult, kuliahSettings] = await Promise.all([
    prisma.asset.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, type: true, coinId: true, amount: true, buyPrice: true, category: true },
    }),
    prisma.accountBalance.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, balance: true },
    }),
    prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 20,
      select: { id: true, title: true, amount: true, category: true, date: true, accountId: true, budgetId: true },
    }),
    prisma.income.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 10,
      select: { id: true, title: true, amount: true, date: true, accountId: true },
    }),
    prisma.budget.findMany({
      where: { userId },
      orderBy: { month: "desc" },
      take: 6,
      select: { id: true, name: true, category: true, limit: true, month: true, notes: true },
    }),
    prisma.accountTransfer.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 10,
      select: { id: true, amount: true, note: true, date: true, fromAccountId: true, toAccountId: true },
    }),
    prisma.semester.findMany({
      where: { userId },
      include: {
        mataKuliah: {
          include: { sessions: { orderBy: { sesiNumber: "asc" } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    prisma.kuliahSettings.findUnique({
      where: { userId },
    }),
  ])

  const semesters = semestersResult.map(sem => ({
    ...sem,
    mataKuliah: sem.mataKuliah.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }))

  const totalBalance = balances.reduce((sum, b) => sum + (b.balance ?? 0), 0)
  const expenseMonth = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)
  const incomeMonth = incomes.reduce((sum, i) => sum + (i.amount ?? 0), 0)
  const netCashFlow = incomeMonth - expenseMonth

  const kuliahSummary = semesters.map((sem) => ({
    semester: sem.nama,
    tanggalMulai: sem.tanggalMulai.toISOString().slice(0, 10),
    mataKuliah: sem.mataKuliah.map((mk) => {
      const tugasSessions = mk.sesiTugasList ? mk.sesiTugasList.split(',').map(Number) : [3,5,7]
      const kehadiranCount = mk.sessions.filter((s) => s.kehadiran).length
      const diskusiVals = mk.sessions.filter((s) => s.diskusi !== null && !tugasSessions.includes(s.sesiNumber)).map((s) => s.diskusi!)
      const tugasVals = mk.sessions.filter((s) => s.tugas !== null && tugasSessions.includes(s.sesiNumber)).map((s) => s.tugas!)
      const avgDiskusi = diskusiVals.length > 0 ? diskusiVals.reduce((a, b) => a + b, 0) / diskusiVals.length : 0
      const avgTugas = tugasVals.length > 0 ? tugasVals.reduce((a, b) => a + b, 0) / tugasVals.length : 0
      return {
        kode: mk.kode,
        nama: mk.nama,
        sks: mk.sks,
        jenis: mk.jenis,
        jumlahSesi: mk.jumlahSesi,
        sesiTugasList: mk.sesiTugasList,
        kehadiran: `${kehadiranCount}/${mk.jumlahSesi}`,
        rataRataDiskusi: limitNumber(avgDiskusi),
        rataRataTugas: limitNumber(avgTugas),
        uasJumlahSoal: mk.uasJumlahSoal,
        uasJumlahBenar: mk.uasJumlahBenar,
      }
    }),
  }))

  // Pre-compute expense breakdown by category for delta analysis
  const expenseByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.category || "Lainnya"
    acc[cat] = (acc[cat] ?? 0) + (e.amount ?? 0)
    return acc
  }, {})

  // Compute budget utilization
  const budgetUtilization = budgets.map(b => {
    const spent = expenses
      .filter(e => e.budgetId === b.id)
      .reduce((sum, e) => sum + (e.amount ?? 0), 0)
    return {
      name: b.name,
      category: b.category,
      limit: b.limit,
      spent,
      remaining: (b.limit ?? 0) - spent,
      utilizationPct: b.limit ? limitNumber((spent / b.limit) * 100) : 0,
      month: b.month.toISOString().slice(0, 7),
    }
  })

  // Financial runway: how many months can user sustain at current burn rate
  const financialRunway = netCashFlow < 0 && totalBalance > 0
    ? limitNumber(totalBalance / Math.abs(netCashFlow))
    : null

  return {
    financialSummary: {
      totalBalance: formatCurrency(totalBalance),
      totalBalanceRaw: totalBalance,
      expenseRecentTotal: formatCurrency(expenseMonth),
      expenseRecentRaw: expenseMonth,
      incomeRecentTotal: formatCurrency(incomeMonth),
      incomeRecentRaw: incomeMonth,
      netCashFlow: formatCurrency(netCashFlow),
      netCashFlowRaw: netCashFlow,
      financialRunwayMonths: financialRunway,
      expenseByCategory,
      budgetUtilization,
    },
    assets: assets.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      coinId: a.coinId,
      amount: limitNumber(a.amount ?? 0, 4),
      buyPrice: limitNumber(a.buyPrice ?? 0, 2),
      category: a.category,
    })),
    balances,
    expenses: expenses.map((e) => ({ ...e, date: e.date.toISOString().slice(0, 10) })),
    incomes: incomes.map((i) => ({ ...i, date: i.date.toISOString().slice(0, 10) })),
    budgets: budgets.map((b) => ({ ...b, month: b.month.toISOString().slice(0, 7) })),
    transfers: transfers.map((t) => ({ ...t, date: t.date.toISOString() })),
    kuliahData: kuliahSummary,
    kuliahSettings: kuliahSettings ? {
      bobotKehadiran: kuliahSettings.bobotKehadiran,
      bobotDiskusi: kuliahSettings.bobotDiskusi,
      bobotTugas: kuliahSettings.bobotTugas,
      kontribusiUAS: kuliahSettings.kontribusiUAS,
      kontribusiTuton: kuliahSettings.kontribusiTuton,
      kontribusiDiskusiPraktik: kuliahSettings.kontribusiDiskusiPraktik,
      kontribusiTugasPraktik: kuliahSettings.kontribusiTugasPraktik,
    } : null,
  }
}

function getUsageInfo(userId: string): { count: number; resetAt: number } {
  const now = Date.now()
  const current = usageMap.get(userId)
  if (current && now < current.resetAt) return current
  return { count: 0, resetAt: now + WINDOW_MS }
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const current = usageMap.get(userId)
  if (current && now < current.resetAt) {
    if (current.count >= DAILY_LIMIT) return false
    usageMap.set(userId, { ...current, count: current.count + 1 })
    return true
  }
  usageMap.set(userId, { count: 1, resetAt: now + WINDOW_MS })
  return true
}

function buildSystemPrompt(context: Awaited<ReturnType<typeof buildUserContext>>, isLowPower: boolean): string {
  const { financialSummary } = context
  const deficit = financialSummary.netCashFlowRaw < 0

  const baseRole = `Anda adalah Financial Strategist & AI Assistant dengan akses read-only ke data keuangan dan akademik user.`

  const financialProtocol = `
## FINANCIAL ANALYSIS PROTOCOL
**Precision First:** Jangan berikan saran generik (e.g., "kurangi pengeluaran"). Lakukan **delta analysis**: bandingkan income vs fixed costs vs discretionary spending secara spesifik.
**Constraint Awareness:** Identifikasi budget gap yang spesifik. ${deficit ? "⚠️ USER SAAT INI DEFISIT — prioritaskan penyesuaian high-impact, bukan penghematan kecil." : ""}
**Liquidity Assessment:** Evaluasi Total Balance vs Monthly Cash Flow untuk menentukan financial runway user secara aktual.
**Format Output:** Gunakan tabel Markdown, bold headers, dan horizontal dividers (---) untuk memisahkan analisis data dari saran teknis.`

  const capabilities = `
## KEMAMPUAN:
1. **Keuangan**: Delta analysis, budget gap detection, liquidity runway, anomali spending
2. **Kuliah/Akademik**: Review progress kuliah UT, analisis nilai tuton, saran perbaikan nilai
3. **General**: Pertanyaan umum, tips produktivitas, perencanaan`

  const rules = isLowPower
    ? `\n## MODE: LOW-POWER (>80% kuota harian)\nBerikan jawaban **sangat ringkas** — maksimal 3-4 bullet points. Prioritaskan insight tertinggi nilainya saja.`
    : `\n## RULES:\n- Bahasa Indonesia ringkas dan mudah dipahami\n- Untuk analisis keuangan: sertakan angka spesifik, bukan persentase abstrak\n- Untuk konteks kuliah: pahami sistem UT (Tuton = Kehadiran + Diskusi + Tugas, Nilai Akhir = UAS + Tuton)\n- Berikan saran actionable dan spesifik berdasarkan data user`

  return `${baseRole}
${financialProtocol}
${capabilities}
${rules}

## DATA USER:
${JSON.stringify(context, null, 2)}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const info = getUsageInfo(session.user.id)
    return NextResponse.json({
      usage: {
        current: info.count,
        limit: DAILY_LIMIT,
        percentage: Math.round((info.count / DAILY_LIMIT) * 100),
        resetAt: info.resetAt,
      }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json({ error: "Daily AI quota reached. Coba lagi besok." }, { status: 429 })
    }

    const body = await req.json()
    const userMessage: string = body.message
    const modelKey: string = body.model || allowedModels[0]
    const history: { role: "user" | "assistant"; content: string }[] = Array.isArray(body.history)
      ? body.history.slice(-HISTORY_WINDOW)
      : []

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json({ error: "Message diperlukan" }, { status: 400 })
    }

    const modelConfig = AI_MODELS[modelKey as keyof typeof AI_MODELS]
    if (!modelConfig) {
      return NextResponse.json({ error: `Model tidak diizinkan: ${modelKey}` }, { status: 400 })
    }

    const usageInfo = getUsageInfo(session.user.id)
    const usagePct = usageInfo.count / DAILY_LIMIT
    const isLowPower = usagePct >= LOW_POWER_THRESHOLD

    const context = await buildUserContext(session.user.id)
    const systemPrompt = buildSystemPrompt(context, isLowPower)

    let content: string

    if (modelConfig.provider === "gemini") {
      try {
        // Build Gemini contents array with history
        const historyContents = history.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }))

        const response = await getGoogleAi().models.generateContent({
          model: modelConfig.model,
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Saya siap membantu." }] },
            ...historyContents,
            { role: "user", parts: [{ text: userMessage }] },
          ],
          config: {
            temperature: 0.4,
            maxOutputTokens: isLowPower ? 512 : 1024,
          }
        })
        content = response.text || "Tidak ada respon dari AI."
      } catch (err: any) {
        console.error("Gemini API Error:", err)
        if (err.message?.includes('quota')) {
          content = "Maaf, kuota Gemini telah habis. Silakan coba model lain seperti Groq."
        } else if (err.message?.includes('retry')) {
          content = "Mohon tunggu sebentar, lalu coba lagi."
        } else {
          content = "Terjadi kesalahan dengan model Gemini. Silakan coba model lain."
        }
      }
    } else if (modelConfig.provider === "groq") {
      const chatCompletion = await getGroq().chat.completions.create({
        model: modelConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage },
        ],
        temperature: 0.4,
        max_tokens: isLowPower ? 512 : 1024,
      })
      content = chatCompletion.choices[0]?.message?.content || "Tidak ada respon dari AI."
    } else {
      content = "Provider tidak didukung."
    }

    const updatedUsage = getUsageInfo(session.user.id)
    return NextResponse.json({
      content,
      usage: {
        current: updatedUsage.count,
        limit: DAILY_LIMIT,
        percentage: Math.round((updatedUsage.count / DAILY_LIMIT) * 100),
        isLowPower,
      },
    })
  } catch (error: unknown) {
    console.error("AI context chat error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `AI Error: ${message}` }, { status: 500 })
  }
}
