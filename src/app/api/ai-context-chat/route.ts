import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { OpenAI } from "openai"
import { AIMessage } from "@/lib/ai"

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_API,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": "Vest AI Finance Tracker",
  },
})

function extractAIContent(message?: AIMessage): string {
  if (!message?.content) return "Tidak ada respon."

  // Case: OpenAI lama
  if (typeof message.content === "string") {
    return message.content.trim() || "Tidak ada respon."
  }

  // Case: OpenRouter / DeepSeek / Llama
  if (Array.isArray(message.content)) {
    const text = message.content
      .map((block) => {
        if (typeof block.text === "string") return block.text

        if (Array.isArray(block.content)) {
          return block.content
            .map((inner) => inner.text ?? "")
            .join("")
        }

        return ""
      })
      .join("")
      .trim()

    return text || "Tidak ada respon."
  }

  return "Tidak ada respon."
}

// Simple in-memory daily rate limit to avoid unexpected cost
const DAILY_LIMIT = 20
const WINDOW_MS = 24 * 60 * 60 * 1000
const usageMap = new Map<string, { count: number; resetAt: number }>()

const okApiKey = !!process.env.OPEN_ROUTER_API

// Model ID mapping: key -> OpenRouter model ID
const MODEL_MAP: Record<string, string> = {
  "deepseek/deepseek-r1-0528": "deepseek/deepseek-r1-0528:free",
  "deepseek/deepseek-v3": "deepseek/deepseek-chat-v3-0324:free",
  "mistralai/mistral-small-3.2-24b-instruct": "mistralai/mistral-small-3.2-24b-instruct:free",
  "google/gemini-2.5-pro-exp-03-25": "google/gemini-2.5-pro-exp-03-25:free",
  "meta-llama/llama-4-maverick": "meta-llama/llama-4-maverick:free",
}

const allowedModels = Object.keys(MODEL_MAP)

const limitNumber = (value: number, decimals = 2) =>
  Number.isFinite(value) ? Number(value.toFixed(decimals)) : 0

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)

// ============================================================================
// Build user context — financial + kuliah data
// ============================================================================
async function buildUserContext(userId: string) {
  const [assets, balances, expenses, incomes, budgets, transfers, semesters, kuliahSettings] = await Promise.all([
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
    // Kuliah data
    prisma.semester.findMany({
      where: { userId },
      include: {
        mataKuliah: {
          include: { sessions: { orderBy: { sesiNumber: "asc" } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    prisma.kuliahSettings.findUnique({
      where: { userId },
    }),
  ])

  const totalBalance = balances.reduce((sum, b) => sum + (b.balance ?? 0), 0)
  const expenseMonth = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)
  const incomeMonth = incomes.reduce((sum, i) => sum + (i.amount ?? 0), 0)

  // Build kuliah summary
  const kuliahSummary = semesters.map((sem) => ({
    semester: sem.nama,
    tanggalMulai: sem.tanggalMulai.toISOString().slice(0, 10),
    mataKuliah: sem.mataKuliah.map((mk) => {
      const kehadiranCount = mk.sessions.filter((s) => s.kehadiran).length
      const diskusiVals = mk.sessions.filter((s) => s.diskusi !== null).map((s) => s.diskusi!)
      const tugasVals = mk.sessions.filter((s) => s.tugas !== null && [3, 5, 7].includes(s.sesiNumber)).map((s) => s.tugas!)
      const avgDiskusi = diskusiVals.length > 0 ? diskusiVals.reduce((a, b) => a + b, 0) / diskusiVals.length : 0
      const avgTugas = tugasVals.length > 0 ? tugasVals.reduce((a, b) => a + b, 0) / tugasVals.length : 0
      return {
        kode: mk.kode,
        nama: mk.nama,
        sks: mk.sks,
        jenis: mk.jenis,
        kehadiran: `${kehadiranCount}/8`,
        rataRataDiskusi: limitNumber(avgDiskusi),
        rataRataTugas: limitNumber(avgTugas),
        uasJumlahSoal: mk.uasJumlahSoal,
        uasJumlahBenar: mk.uasJumlahBenar,
      }
    }),
  }))

  return {
    financialSummary: {
      totalBalance: formatCurrency(totalBalance),
      expenseRecentTotal: formatCurrency(expenseMonth),
      incomeRecentTotal: formatCurrency(incomeMonth),
      netRecent: formatCurrency(incomeMonth - expenseMonth),
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

function checkRateLimit(userId: string) {
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

export async function POST(req: NextRequest) {
  try {
    if (!okApiKey) return NextResponse.json({ error: "OpenRouter API key missing" }, { status: 503 })

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json({ error: "Daily AI quota reached. Coba lagi besok." }, { status: 429 })
    }

    const body = await req.json()
    const userMessage: string = body.message
    const modelKey: string = body.model || allowedModels[0]

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json({ error: "Message diperlukan" }, { status: 400 })
    }

    // Resolve model ID — accept any key that maps to a known model
    const apiModelId = MODEL_MAP[modelKey]
    if (!apiModelId) {
      return NextResponse.json({ error: `Model tidak diizinkan: ${modelKey}` }, { status: 400 })
    }

    const context = await buildUserContext(session.user.id)

    const systemPrompt = `Anda adalah AI Assistant serba bisa yang bisa membantu user dalam berbagai konteks. Anda memiliki akses read-only ke data user berikut:

## Kemampuan Anda:
1. **Keuangan**: Analisis pengeluaran, saran budget, ringkasan keuangan, deteksi anomali spending
2. **Kuliah/Akademik**: Review progress kuliah UT, analisis nilai tuton, saran perbaikan nilai, reminder deadline sesi
3. **General**: Pertanyaan umum, tips produktivitas, perencanaan

## Rules:
- Gunakan bahasa Indonesia yang ringkas dan mudah dipahami
- Format jawaban dengan bullet points atau paragraf pendek
- Jangan berikan saran investasi spesifik
- Untuk konteks kuliah, pahami sistem UT: 8 sesi per semester, Kehadiran/Diskusi/Tugas, bobot Tuton (Kehadiran + Diskusi + Tugas), Nilai Akhir = UAS + Tuton
- Berikan saran yang actionable dan spesifik berdasarkan data user

## DATA USER:
${JSON.stringify(context, null, 2)}`

    const completion = await openai.chat.completions.create({
      model: apiModelId,
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 1024,
    })

    const rawMessage = completion.choices?.[0]?.message as AIMessage | undefined
    const content = extractAIContent(rawMessage)

    return NextResponse.json({ content })
  } catch (error: unknown) {
    console.error("AI context chat error:", error)
    // Return more useful error info
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `AI Error: ${message}` }, { status: 500 })
  }
}
