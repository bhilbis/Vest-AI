import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PDFParse } from "pdf-parse"
import mammoth from "mammoth"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file)
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })

    if (file.size > MAX_FILE_SIZE)
      return NextResponse.json({ error: "File terlalu besar (maks 10MB)" }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileName = file.name.toLowerCase()

    let extractedText = ""

    if (fileName.endsWith(".pdf")) {
      const parser = new PDFParse({ data: buffer })
      const data = await parser.getText()
      extractedText = data.text
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value
    } else if (fileName.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8")
    } else {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan PDF, DOCX, atau TXT." },
        { status: 400 }
      )
    }

    const cleaned = extractedText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()

    if (!cleaned || cleaned.length < 50)
      return NextResponse.json(
        { error: "Teks yang diekstrak terlalu pendek atau kosong. Pastikan file berisi teks yang dapat dibaca." },
        { status: 400 }
      )

    // Cap at 50k chars to avoid oversized AI prompts
    const cappedText =
      cleaned.length > 50000
        ? cleaned.slice(0, 50000) + "\n\n[... teks dipotong karena terlalu panjang]"
        : cleaned

    return NextResponse.json({ extractedText: cappedText, charCount: cleaned.length })
  } catch (error) {
    console.error("Extract error:", error)
    return NextResponse.json({ error: "Gagal mengekstrak teks dari file" }, { status: 500 })
  }
}
