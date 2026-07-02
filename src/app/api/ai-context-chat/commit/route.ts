export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { commitDraft, type CommitKind } from "@/lib/ai/commit"

/**
 * Commit draft transaksi yang diusulkan agent. Dipanggil HANYA oleh aksi user
 * eksplisit (tombol Approve), bukan oleh model. Approval gate inti (blueprint §12).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const kind = body?.kind as CommitKind
    const draft = body?.draft
    const draftId = body?.draftId as string | undefined

    if (kind !== "expense" && kind !== "income" && kind !== "transfer") {
      return NextResponse.json({ error: "kind harus 'expense', 'income', atau 'transfer'" }, { status: 400 })
    }
    if (!draft || typeof draft !== "object") {
      return NextResponse.json({ error: "draft diperlukan" }, { status: 400 })
    }

    const result = await commitDraft(kind, draft, session.user.id)

    console.log(`[ai-commit] user=${session.user.id} kind=${kind} status=${result.status} ref=${result.ref ?? "-"}`)

    if (result.status === "ok") {
      // Mark draft sebagai committed di DB (blueprint §9).
      if (draftId) {
        await prisma.agentDraft.updateMany({
          where: { id: draftId, userId: session.user.id },
          data: { status: "committed" },
        })
      }
      return NextResponse.json(result)
    }
    // error (validasi/saldo) -> 400 supaya klien menampilkan pesan jelas.
    return NextResponse.json(result, { status: 400 })
  } catch (error: unknown) {
    console.error("AI commit error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Commit Error: ${message}` }, { status: 500 })
  }
}
