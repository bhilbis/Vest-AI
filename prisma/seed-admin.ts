// prisma/seed-admin.ts
// Run: npx tsx prisma/seed-admin.ts
import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const ADMIN_EMAIL = "admin@vestai.com"
const ADMIN_PASSWORD = "Admin@12345"
const ADMIN_NAME = "Administrator"

async function main() {
  console.log("🔐 Seeding admin account...")

  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  })

  if (existing) {
    console.log(`⚠️  Admin with email ${ADMIN_EMAIL} already exists.`)
    if (existing.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN" },
      })
      console.log("✅ Updated existing user role to ADMIN.")
    }
    return
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12)

  const admin = await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashed,
      role: "ADMIN",
      isActive: true,
    },
  })

  console.log(`✅ Admin created successfully!`)
  console.log(`   ID:    ${admin.id}`)
  console.log(`   Email: ${ADMIN_EMAIL}`)
  console.log(`   Pass:  ${ADMIN_PASSWORD}`)
  console.log(``)
  console.log(`⚠️  PENTING: Ganti password setelah login pertama!`)
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
