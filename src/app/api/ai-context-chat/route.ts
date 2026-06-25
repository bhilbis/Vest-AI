/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GoogleGenAI } from "@google/genai"
import Groq from "groq-sdk"
import { GEMINI_API_KEY, GROQ_API_KEY } from "@/lib/env"
import { buildSystemPrompt } from "@/lib/ai/prompt"
import { getFinancialSummary } from "@/lib/services/financeSummary"
import { runGroqAgent, runGeminiAgent, type ChatMessage, type AgentTrace, type TokenUsage } from "@/lib/ai/agent-loop"
import { buildRunTrace, logRunTrace, type FinalStatus } from "@/lib/ai/trace"

function getGoogleAi() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "BUILD_DUMMY") {
    throw new Error("GEMINI_API_KEY belum diset")
  }
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY })
}

function getGroq() {
  if (!GROQ_API_KEY || GROQ_API_KEY === "BUILD_DUMMY") {
    throw new Error("GROQ_API_KEY belum diset")
  }
  return new Groq({ apiKey: GROQ_API_KEY })
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

async function buildUserContext(userId: string) {
  // financialSummary (agregat) menggantikan income/budget/expense mentah.
  // Rincian expense diambil via tool `list_expenses`; budget via budgetUtilization.
  // assets, balances, kuliah tetap di sini karena belum ada toolnya.
  const [financialSummary, assets, balances, semestersResult, kuliahSettings] = await Promise.all([
    getFinancialSummary(userId),
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

  return {
    financialSummary,
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

export async function GET() {
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
    const systemPrompt = buildSystemPrompt(context, { isLowPower })

    const agentOpts = {
      model: modelConfig.model,
      systemPrompt,
      history: history as ChatMessage[],
      userMessage,
      ctx: { userId: session.user.id },
      temperature: 0.4,
      maxTokens: isLowPower ? 512 : 1024,
    }

    const startedAt = Date.now()
    let content: string
    let toolCalls: AgentTrace[] = []
    let steps = 0
    let tokens: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    let finalStatus: FinalStatus = "answer"

    if (modelConfig.provider === "gemini") {
      try {
        const result = await runGeminiAgent(getGoogleAi(), agentOpts)
        content = result.content
        toolCalls = result.toolCalls
        steps = result.steps
        tokens = result.usage
      } catch (err: any) {
        console.error("Gemini API Error:", err)
        finalStatus = "error"
        if (err.message?.includes('quota')) {
          content = "Maaf, kuota Gemini telah habis. Silakan coba model lain seperti Groq."
        } else if (err.message?.includes('retry')) {
          content = "Mohon tunggu sebentar, lalu coba lagi."
        } else {
          content = "Terjadi kesalahan dengan model Gemini. Silakan coba model lain."
        }
      }
    } else if (modelConfig.provider === "groq") {
      const result = await runGroqAgent(getGroq(), agentOpts)
      content = result.content
      toolCalls = result.toolCalls
      steps = result.steps
      tokens = result.usage
    } else {
      content = "Provider tidak didukung."
      finalStatus = "error"
    }

    // Draft transaksi yang menunggu approval user (commit dilakukan terpisah).
    const rawDrafts = toolCalls
      .filter(t => t.result.status === "needs_approval")
      .map(t => t.result.data as Record<string, unknown>)

    // Persist setiap draft ke DB agar tidak hilang jika halaman di-refresh (blueprint §9).
    const pendingDrafts = await Promise.all(
      rawDrafts.map(async (draft) => {
        const saved = await prisma.agentDraft.create({
          data: {
            userId: session.user.id,
            kind: String(draft.kind ?? "expense"),
            data: draft as Parameters<typeof prisma.agentDraft.create>[0]["data"]["data"],
            status: "pending",
          },
        })
        return { ...draft, _dbId: saved.id }
      })
    )

    if (pendingDrafts.length > 0 && finalStatus === "answer") {
      finalStatus = "pending_approval"
    }

    // Observability terstruktur (blueprint §13).
    logRunTrace(
      buildRunTrace({
        userId: session.user.id,
        model: modelKey,
        steps,
        toolCalls,
        tokens,
        pendingDrafts: pendingDrafts.length,
        finalStatus,
        durationMs: Date.now() - startedAt,
      }),
    )

    const updatedUsage = getUsageInfo(session.user.id)
    return NextResponse.json({
      content,
      pendingDrafts,
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
