import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — List all exam preps for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const preps = await prisma.examPrep.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      // Omit extractedText and questions from list view to keep payload small
      summary: true,
    },
  })

  return NextResponse.json(preps)
}

// POST — Save a new exam prep
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, extractedText, summary, questions } = await req.json()

  if (!title || !extractedText || !summary || !Array.isArray(questions))
    return NextResponse.json({ error: "Field tidak lengkap" }, { status: 400 })

  const prep = await prisma.examPrep.create({
    data: {
      title,
      extractedText,
      summary,
      questions,
      userId: session.user.id,
    },
  })

  return NextResponse.json(prep, { status: 201 })
}
