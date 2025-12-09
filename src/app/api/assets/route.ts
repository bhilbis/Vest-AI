import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/*
 * SUGGESTED PRISMA SCHEMA INDEXES:
 * model Asset {
 *   @@index([userId, type])  // For filtering by asset type per user
 *   @@index([userId, createdAt])  // For ordering by creation date (already using orderBy)
 * }
 */

// GET: Ambil semua aset
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Optimize: Select only fields actually used by frontend
  // Frontend uses: id, name, type, category, color, amount, buyPrice, coinId, positionX, positionY, createdAt
  const assets = await prisma.asset.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      category: true,
      color: true,
      amount: true,
      buyPrice: true,
      coinId: true,
      positionX: true,
      positionY: true,
      createdAt: true,
      // Exclude userId as it's not needed in response
    },
  })
  return NextResponse.json(assets)
}

// POST: Tambah aset baru
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const body = await req.json()
  const { name, amount, buyPrice, type, category, color, coinId } = body

  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const asset = await prisma.asset.create({
    data: {
      name,
      amount: parseFloat(amount),
      buyPrice: parseFloat(buyPrice),
      type: type || 'stock',
      category: category || type || 'stock',
      color: color || 'bg-gray-500',
      coinId: coinId || null,
      userId: session.user.id,
    },
  })

  return NextResponse.json(asset)
}


