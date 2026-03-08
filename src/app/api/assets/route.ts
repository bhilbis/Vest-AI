import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getAssets, createAsset } from "@/lib/services/assetService"

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

  try {
    const assets = await getAssets(session.user.id)
    return NextResponse.json(assets)
  } catch (error) {
    console.error("Error fetching assets:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// POST: Tambah aset baru
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const body = await req.json()
  const { name, amount, buyPrice, type, category, color, coinId } = body

  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const asset = await createAsset({
      name,
      amount: parseFloat(amount),
      buyPrice: parseFloat(buyPrice),
      type,
      category,
      color,
      coinId,
      userId: session.user.id,
    })

    return NextResponse.json(asset)
  } catch (error) {
    console.error("Error creating asset:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


