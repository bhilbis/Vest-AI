import { prisma } from "@/lib/prisma"

/**
 * Kuota harian AI per user, disimpan di DB (tabel AiUsage) agar persisten
 * lintas deploy dan konsisten saat multi-instance.
 */

export const DAILY_LIMIT = 20
const WINDOW_MS = 24 * 60 * 60 * 1000

export type UsageInfo = { count: number; resetAt: number }

export async function getUsageInfo(userId: string): Promise<UsageInfo> {
  const row = await prisma.aiUsage.findUnique({ where: { userId } })
  const now = Date.now()
  if (!row || row.resetAt.getTime() <= now) {
    return { count: 0, resetAt: now + WINDOW_MS }
  }
  return { count: row.count, resetAt: row.resetAt.getTime() }
}

/** Konsumsi 1 kuota. Return false jika limit harian sudah tercapai. */
export async function consumeQuota(userId: string): Promise<boolean> {
  const now = new Date()

  // Jalur cepat & atomik: increment hanya jika window aktif dan masih di bawah limit
  const updated = await prisma.aiUsage.updateMany({
    where: { userId, resetAt: { gt: now }, count: { lt: DAILY_LIMIT } },
    data: { count: { increment: 1 } },
  })
  if (updated.count > 0) return true

  // Tidak ter-update: belum ada row, window kadaluarsa, atau limit tercapai
  const row = await prisma.aiUsage.findUnique({ where: { userId } })
  if (row && row.resetAt.getTime() > now.getTime()) return false

  await prisma.aiUsage.upsert({
    where: { userId },
    create: { userId, count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
    update: { count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
  })
  return true
}
