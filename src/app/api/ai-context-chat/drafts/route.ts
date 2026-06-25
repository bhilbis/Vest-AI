export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const DRAFT_MAX_AGE_DAYS = 7

/** GET — ambil draft pending milik user (maks 7 hari terakhir). */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const since = new Date()
    since.setDate(since.getDate() - DRAFT_MAX_AGE_DAYS)

    const rows = await prisma.agentDraft.findMany({
      where: { userId: session.user.id, status: "pending", createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    const drafts = rows.map((r) => ({
      ...(r.data as object),
      _dbId: r.id,
    }))

    return NextResponse.json({ drafts })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** PATCH — tandai draft sebagai rejected. Body: { id: string } */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const id = body?.id as string | undefined

    if (!id) {
      return NextResponse.json({ error: "id diperlukan" }, { status: 400 })
    }

    await prisma.agentDraft.updateMany({
      where: { id, userId: session.user.id, status: "pending" },
      data: { status: "rejected" },
    })

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
