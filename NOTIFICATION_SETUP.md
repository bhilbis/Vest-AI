# Notification Setup Guide

Panduan lengkap mengaktifkan **Web Push** dan **Email** notifications di Vest AI.

---

## 1. Web Push Notifications

### Cara Kerja
Browser → izin notifikasi → subscribe via `pushManager` → kirim subscription ke server → server simpan di DB → server kirim push dengan VAPID key.

### Langkah Setup

#### 1.1 Generate VAPID Keys

```bash
bunx web-push generate-vapid-keys
```

Output contoh:
```
Public Key:  BHxZ1q3...
Private Key: abc123...
```

#### 1.2 Install Package

```bash
bun add web-push
bun add -d @types/web-push
```

#### 1.3 Tambahkan ke `.env`

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BHxZ1q3..."   # public key (aman di frontend)
VAPID_PRIVATE_KEY="abc123..."               # JANGAN expose ke frontend
VAPID_EMAIL="mailto:lbbpramuka@gmail.com"   # email kontak untuk VAPID
```

#### 1.4 Buat Model DB (Prisma)

Tambahkan ke `prisma/schema.prisma`:

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

Kemudian tambah relasi di model `User`:
```prisma
pushSubscriptions PushSubscription[]
```

Jalankan migrasi:
```bash
bunx prisma migrate dev --name add_push_subscriptions
```

#### 1.5 Update API `/api/push/subscribe/route.ts`

Setelah DB siap, update stub yang ada dengan implementasi penuh:

```ts
// POST — simpan subscription baru
import webpush from "web-push"

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

// dalam handler POST:
const { subscription } = body  // { endpoint, keys: { p256dh, auth } }
await prisma.pushSubscription.upsert({
  where: { endpoint: subscription.endpoint },
  update: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  create: {
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  },
})

// DELETE — hapus subscription
await prisma.pushSubscription.deleteMany({ where: { userId } })
```

#### 1.6 Kirim Push dari Server (contoh)

Buat helper `lib/push.ts`:

```ts
import webpush from "web-push"
import { prisma } from "@/lib/prisma"

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      )
    )
  )
}
```

**Contoh penggunaan** — kirim notif saat pengeluaran melewati budget:
```ts
await sendPushToUser(userId, {
  title: "⚠️ Budget Hampir Habis",
  body: `Budget "${budgetName}" sudah terpakai 90%`,
  url: "/financial-overview/budgets",
})
```

---

## 2. Email Notifications

### Pilihan Service

| Service | Free tier | Rekomendasi |
|---|---|---|
| **Resend** | 3.000 email/bulan | ✅ Paling mudah untuk Next.js |
| Nodemailer + Gmail | Unlimited (limit SMTP) | Untuk dev/testing |
| SendGrid | 100 email/hari | Alternatif |

### Setup Resend (Rekomendasi)

#### 2.1 Install

```bash
bun add resend
```

#### 2.2 Daftar & Dapatkan API Key

1. Buka [resend.com](https://resend.com) → daftar gratis
2. Settings → API Keys → Create API Key
3. Verifikasi domain (opsional untuk free tier, pakai `onboarding@resend.dev`)

#### 2.3 Tambahkan ke `.env`

```env
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="Vest AI <noreply@yourdomain.com>"
# Untuk free tier tanpa domain sendiri:
# EMAIL_FROM="Vest AI <onboarding@resend.dev>"
```

#### 2.4 Buat Helper `lib/email.ts`

```ts
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    html,
  })
}
```

#### 2.5 Template Email Laporan Mingguan

Buat `lib/email-templates.ts`:

```ts
export function weeklyReportTemplate(data: {
  name: string
  totalIncome: number
  totalExpense: number
  netCashflow: number
  topCategory: string
}) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0f172a;">Laporan Mingguan Vest AI</h1>
      <p>Halo ${data.name},</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td>Total Pemasukan</td><td>Rp ${data.totalIncome.toLocaleString("id-ID")}</td></tr>
        <tr><td>Total Pengeluaran</td><td>Rp ${data.totalExpense.toLocaleString("id-ID")}</td></tr>
        <tr><td>Net Cashflow</td><td>Rp ${data.netCashflow.toLocaleString("id-ID")}</td></tr>
        <tr><td>Kategori Terbesar</td><td>${data.topCategory}</td></tr>
      </table>
      <a href="https://yourapp.com/financial-overview" style="display:inline-block; margin-top:16px; padding:10px 20px; background:#6366f1; color:#fff; border-radius:8px; text-decoration:none;">
        Lihat Detail
      </a>
    </div>
  `
}
```

#### 2.6 API Endpoint Pengiriman Email Mingguan

Buat `src/app/api/notifications/weekly-report/route.ts`:

```ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { weeklyReportTemplate } from "@/lib/email-templates"

// Panggil dari cron job (Vercel Cron / external scheduler) setiap Senin jam 08:00
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    where: { email: { not: null }, isActive: true },
    select: { id: true, name: true, email: true },
  })

  // Kirim ke semua user (tambah filter preference nanti)
  for (const user of users) {
    if (!user.email) continue
    // Hitung data minggu lalu...
    await sendEmail(
      user.email,
      "Laporan Mingguan Vest AI",
      weeklyReportTemplate({ name: user.name || "Member", totalIncome: 0, totalExpense: 0, netCashflow: 0, topCategory: "-" }),
    )
  }

  return NextResponse.json({ ok: true, sent: users.length })
}
```

#### 2.7 Jadwalkan dengan Vercel Cron

Buat/update `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/weekly-report",
      "schedule": "0 1 * * 1"
    }
  ]
}
```

> `0 1 * * 1` = Setiap Senin jam 08:00 WIB (UTC+7, jadi jam 01:00 UTC)

Tambahkan `CRON_SECRET` ke `.env` dan Vercel environment:
```env
CRON_SECRET="random-secret-string-panjang"
```

---

## 3. Checklist Implementasi

### Web Push

- [ ] `bun add web-push && bun add -d @types/web-push`
- [ ] Generate VAPID keys: `bunx web-push generate-vapid-keys`
- [ ] Tambah `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` ke `.env`
- [ ] Tambah model `PushSubscription` ke `schema.prisma`
- [ ] Jalankan `bunx prisma migrate dev --name add_push_subscriptions`
- [ ] Update `src/app/api/push/subscribe/route.ts` dengan implementasi penuh
- [ ] Buat `lib/push.ts` helper
- [ ] Sambungkan helper ke logic bisnis (budget alert, dll)

### Email
- [ ] Daftar di Resend & dapatkan API key
- [ ] `bun add resend`
- [ ] Tambah `RESEND_API_KEY` dan `EMAIL_FROM` ke `.env`
- [ ] Buat `lib/email.ts` dan `lib/email-templates.ts`
- [ ] Buat endpoint `/api/notifications/weekly-report`
- [ ] Setup `vercel.json` cron + `CRON_SECRET`
- [ ] (Opsional) Tambah kolom `emailNotifications Boolean @default(true)` di model `User` untuk preference per-user

---

## 4. Testing Lokal

### Test Push Notification

1. Buka app di browser → Settings → aktifkan notifikasi
2. Dari terminal, kirim push manual:

```bash
node -e "
const webpush = require('web-push');
webpush.setVapidDetails('mailto:test@test.com', 'PUBLIC_KEY', 'PRIVATE_KEY');
webpush.sendNotification({ endpoint: 'ENDPOINT', keys: { p256dh: 'P256DH', auth: 'AUTH' } }, JSON.stringify({ title: 'Test', body: 'Halo dari server!' }));
"
```

### Test Email

```bash
curl -X POST http://localhost:3000/api/notifications/weekly-report \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## Catatan Penting

- **VAPID keys bersifat permanen** — jangan regenerate setelah production karena semua subscription browser akan invalid
- **Free tier Resend** tidak butuh domain sendiri tapi pengirim terbatas ke `onboarding@resend.dev` — verifikasi domain untuk email dari alamat sendiri
- **iOS Safari** mendukung Web Push mulai iOS 16.4+ dan hanya saat PWA di-install ke home screen
- Service worker push handler sudah ada di `public/sw.js`
