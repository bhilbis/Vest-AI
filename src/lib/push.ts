import webpush from "web-push"
import { prisma } from "@/lib/prisma"

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  if (!subs.length) return

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      ).catch(async (err) => {
        // subscription expired or invalid — remove from DB
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null)
        }
      }),
    ),
  )
}
