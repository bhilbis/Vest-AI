import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UASPrepClient } from "@/components/uas-prep/UASPrepClient"

export const metadata = {
  title: "UAS Prep — Kisi-kisi & Latihan Soal",
}

export default async function UASPrepPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const preps = await prisma.examPrep.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, summary: true, createdAt: true },
  })

  const initialSaved = preps.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">UAS Prep</h2>
        <p className="text-sm text-muted-foreground">
          Upload kisi-kisi, ekstrak teks, lalu generate ringkasan & latihan soal otomatis dengan AI.
        </p>
      </div>
      <UASPrepClient initialSaved={initialSaved} />
    </div>
  )
}
