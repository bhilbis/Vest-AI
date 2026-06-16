import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GoogleGenAI } from "@google/genai"
import Groq from "groq-sdk"
import OpenAI from "openai"
import { GEMINI_API_KEY, GROQ_API_KEY } from "@/lib/env"

export const runtime = "nodejs"

export interface Question {
  id: number
  pertanyaan: string
  pilihan: string[]   // ["A. ...", "B. ...", "C. ...", "D. ..."]
  jawaban: number     // index 0-3
  penjelasan: string
}

export interface GenerateResult {
  summary: string
  questions: Question[]
}

// ── Token budget per provider (free tier limits) ──────────────────────────────
// Groq free:       12 000 TPM total (input + output). Reserve 6 000 for output.
//                  → max input ≈ 6 000 tokens ≈ 14 000 chars (conservative)
// Gemini free:     1M TPM — no practical char limit within our 50k cap
// OpenRouter free: varies by model, 40k chars is a safe conservative default
const TEXT_LIMIT: Record<string, number> = {
  groq:        14_000,
  gemini:      50_000,
  openrouter:  40_000,
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + "\n\n[... teks dipotong agar sesuai batas model]"
}

function buildPrompt(title: string, text: string, count: number): string {
  return `Kamu adalah asisten akademik. Berdasarkan kisi-kisi/materi berikut berjudul "${title}", buatlah:
1. Ringkasan padat (3-4 paragraf) dalam Bahasa Indonesia yang mencakup poin-poin kunci materi.
2. Tepat ${count} soal pilihan ganda dalam Bahasa Indonesia.

ATURAN SOAL:
- Variasikan tingkat kesulitan: 40% mudah, 40% sedang, 20% sulit
- Setiap soal memiliki 4 pilihan (A, B, C, D), hanya 1 yang benar
- Pilihan jawaban harus masuk akal (hindari distraktor yang terlalu mudah ditebak)
- Sertakan penjelasan singkat mengapa jawaban itu benar

MATERI:
${text}

Kembalikan HANYA JSON valid dengan format persis ini (tidak ada teks lain di luar JSON):
{
  "summary": "ringkasan di sini...",
  "questions": [
    {
      "id": 1,
      "pertanyaan": "Pertanyaan soal...",
      "pilihan": ["A. pilihan A", "B. pilihan B", "C. pilihan C", "D. pilihan D"],
      "jawaban": 0,
      "penjelasan": "Penjelasan singkat..."
    }
  ]
}`
}

function parseJson(raw: string): GenerateResult {
  const jsonStr = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
  return JSON.parse(jsonStr)
}

function isRetryable(err: unknown): boolean {
  // JSON parse failure means the model returned malformed output — try next model
  if (err instanceof SyntaxError) return true
  const msg = err instanceof Error ? err.message : String(err)
  // Empty response from model — try next
  if (!msg || msg === "null" || msg === "undefined") return true
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("413") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("too large") ||
    msg.includes("too many tokens") ||
    msg.includes("tokens per minute") ||
    msg.includes("JSON") ||
    msg.includes("json") ||
    msg.includes("Unexpected token") ||
    msg.includes("parse") ||
    msg.includes("invalid response") ||
    msg.includes("Respons tidak lengkap") ||
    msg.includes("Empty response")
  )
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function tryGemini(model: string, text: string, title: string, count: number): Promise<GenerateResult> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "BUILD_DUMMY")
    throw new Error("GEMINI_API_KEY tidak dikonfigurasi")

  const prompt = buildPrompt(title, truncate(text, TEXT_LIMIT.gemini), count)
  const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  const response = await genai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.5,
      maxOutputTokens: 16000,
      responseMimeType: "application/json",
    },
  })
  return parseJson(response.text?.trim() ?? "")
}

// ── Groq ──────────────────────────────────────────────────────────────────────

async function tryGroq(model: string, text: string, title: string, count: number): Promise<GenerateResult> {
  if (!GROQ_API_KEY || GROQ_API_KEY === "BUILD_DUMMY")
    throw new Error("GROQ_API_KEY tidak dikonfigurasi")

  const prompt = buildPrompt(title, truncate(text, TEXT_LIMIT.groq), count)
  const groq = new Groq({ apiKey: GROQ_API_KEY })
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "Kamu adalah asisten akademik. Selalu kembalikan respons dalam format JSON yang valid sesuai instruksi. Jangan tambahkan teks apapun di luar JSON.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 6000,
    response_format: { type: "json_object" },
  })
  return parseJson(completion.choices[0]?.message?.content ?? "")
}

// ── OpenRouter ────────────────────────────────────────────────────────────────

async function tryOpenRouter(model: string, text: string, title: string, count: number): Promise<GenerateResult> {
  const apiKey = process.env.OPEN_ROUTER_API
  if (!apiKey) throw new Error("OPEN_ROUTER_API tidak dikonfigurasi")

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  })

  const prompt = buildPrompt(title, truncate(text, TEXT_LIMIT.openrouter), count)
  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "Kamu adalah asisten akademik. Selalu kembalikan respons dalam format JSON yang valid sesuai instruksi. Jangan tambahkan teks apapun di luar JSON.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 8000,
    response_format: { type: "json_object" },
  })
  return parseJson(completion.choices[0]?.message?.content ?? "")
}

// ── Handler ───────────────────────────────────────────────────────────────────

type Provider = { name: string; fn: () => Promise<GenerateResult> }

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { title, extractedText, questionCount = 30 } = await req.json()

    if (!title || !extractedText)
      return NextResponse.json({ error: "title dan extractedText diperlukan" }, { status: 400 })

    const count = Math.min(Math.max(Number(questionCount) || 30, 20), 50)

    // Groq prioritas utama (gratis, cepat)
    // Gemini sebagai cadangan kedua
    // OpenRouter free models sebagai cadangan akhir (banyak pilihan)
    const providers: Provider[] = [
      // ── Groq (direct, free tier) ─────────────────────────────────────────
      { name: "Groq Llama 3.3 70B",    fn: () => tryGroq("llama-3.3-70b-versatile",   extractedText, title, count) },
      { name: "Groq Llama 3.1 8B",     fn: () => tryGroq("llama-3.1-8b-instant",      extractedText, title, count) },
      // ── Gemini (direct, free tier) ───────────────────────────────────────
      { name: "Gemini 2.5 Flash",      fn: () => tryGemini("gemini-2.5-flash",         extractedText, title, count) },
      { name: "Gemini 2.0 Flash",      fn: () => tryGemini("gemini-2.0-flash",         extractedText, title, count) },
      { name: "Gemini 2.0 Flash Lite", fn: () => tryGemini("gemini-2.0-flash-lite",    extractedText, title, count) },
      // ── OpenRouter free models (verified from catalog Jun 2026) ─────────
      // Large/capable models first; 429 = rate-limited but still free
      { name: "OR GPT-OSS 120B",       fn: () => tryOpenRouter("openai/gpt-oss-120b:free",                       extractedText, title, count) },
      { name: "OR Llama 3.3 70B",      fn: () => tryOpenRouter("meta-llama/llama-3.3-70b-instruct:free",         extractedText, title, count) },
      { name: "OR Hermes 3 405B",      fn: () => tryOpenRouter("nousresearch/hermes-3-llama-3.1-405b:free",      extractedText, title, count) },
      { name: "OR Qwen3 Next 80B",     fn: () => tryOpenRouter("qwen/qwen3-next-80b-a3b-instruct:free",          extractedText, title, count) },
      { name: "OR Nemotron Super 120B",fn: () => tryOpenRouter("nvidia/nemotron-3-super-120b-a12b:free",         extractedText, title, count) },
      { name: "OR Gemma 4 26B",        fn: () => tryOpenRouter("google/gemma-4-26b-a4b-it:free",                 extractedText, title, count) },
      { name: "OR Nemotron Nano Omni", fn: () => tryOpenRouter("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", extractedText, title, count) },
      { name: "OR Nemotron Nano 30B",  fn: () => tryOpenRouter("nvidia/nemotron-3-nano-30b-a3b:free",            extractedText, title, count) },
      { name: "OR GPT-OSS 20B",        fn: () => tryOpenRouter("openai/gpt-oss-20b:free",                        extractedText, title, count) },
      { name: "OR Qwen3 Coder",        fn: () => tryOpenRouter("qwen/qwen3-coder:free",                          extractedText, title, count) },
      { name: "OR Nemotron 12B VL",    fn: () => tryOpenRouter("nvidia/nemotron-nano-12b-v2-vl:free",            extractedText, title, count) },
      { name: "OR Dolphin Mistral 24B",fn: () => tryOpenRouter("cognitivecomputations/dolphin-mistral-24b-venice-edition:free", extractedText, title, count) },
      { name: "OR Nex N2 Pro",         fn: () => tryOpenRouter("nex-agi/nex-n2-pro:free",                        extractedText, title, count) },
      { name: "OR Laguna M.1",         fn: () => tryOpenRouter("poolside/laguna-m.1:free",                       extractedText, title, count) },
      { name: "OR LFM 1.2B Instruct",  fn: () => tryOpenRouter("liquid/lfm-2.5-1.2b-instruct:free",             extractedText, title, count) },
      { name: "OR OpenRouter Free",    fn: () => tryOpenRouter("openrouter/free",                                 extractedText, title, count) },
    ]

    let lastError: unknown
    for (const provider of providers) {
      try {
        console.log(`[uas-prep/generate] Mencoba ${provider.name}...`)
        const result = await provider.fn()

        if (!result.summary || !Array.isArray(result.questions) || result.questions.length === 0)
          throw new Error("Respons tidak lengkap")

        console.log(`[uas-prep/generate] Berhasil dengan ${provider.name}`)
        return NextResponse.json({ ...result, _model: provider.name })
      } catch (err) {
        lastError = err
        if (isRetryable(err)) {
          console.warn(`[uas-prep/generate] ${provider.name} tidak tersedia, mencoba berikutnya...`)
          continue
        }
        console.error(`[uas-prep/generate] Error non-retryable dari ${provider.name}:`, err)
        break
      }
    }

    const msg = lastError instanceof Error ? lastError.message : "Semua model AI sedang sibuk"
    return NextResponse.json(
      { error: `Gagal generate soal: ${msg}. Coba lagi dalam beberapa menit.` },
      { status: 503 }
    )
  } catch (error) {
    console.error("Generate error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan, coba lagi." }, { status: 500 })
  }
}
