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
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", // ganti ke domain kamu
    "X-Title": "AI Finance Tracker",         // bebas, tapi WAJIB ada
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

const models = [
  "deepseek/deepseek-r1-0528",
  "deepseek/deepseek-v3",
  "meta-llama/llama-4-maverick",
  "mistralai/mistral-small-3.2-24b-instruct",
]

const limitNumber = (value: number, decimals = 2) =>
  Number.isFinite(value) ? Number(value.toFixed(decimals)) : 0

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)

async function buildUserContext(userId: string) {
  const [assets, balances, expenses, incomes, budgets, transfers] = await Promise.all([
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
  ])

  const totalBalance = balances.reduce((sum, b) => sum + (b.balance ?? 0), 0)
  const expenseMonth = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)
  const incomeMonth = incomes.reduce((sum, i) => sum + (i.amount ?? 0), 0)

  return {
    summary: {
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
    const model: string = body.model || models[0]

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json({ error: "Message diperlukan" }, { status: 400 })
    }

    if (!models.includes(model)) {
      return NextResponse.json({ error: "Model tidak diizinkan" }, { status: 400 })
    }

    const context = await buildUserContext(session.user.id)

    const systemPrompt = `Anda adalah asisten keuangan. Gunakan data JSON berikut untuk menjawab ringkas dan actionable. Jika data kurang, minta klarifikasi. Jangan berikan saran investasi spesifik jika data tidak cukup.
        CONTEXT:
        ${JSON.stringify(context, null, 2)}
    `

    const completion = await openai.chat.completions.create({
      model,
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 400,
    })

    const rawMessage = completion.choices?.[0]?.message as AIMessage | undefined
    const content = extractAIContent(rawMessage)

    return NextResponse.json({ content })
  } catch (error) {
    console.error("AI context chat error", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
