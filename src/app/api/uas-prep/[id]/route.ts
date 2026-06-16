import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — Fetch single exam prep (full data including questions)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const prep = await prisma.examPrep.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!prep) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })

  return NextResponse.json(prep)
}

// DELETE — Delete an exam prep
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const prep = await prisma.examPrep.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!prep) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })

  await prisma.examPrep.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
