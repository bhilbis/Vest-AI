import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password)
      return NextResponse.json({ error: "Email & password wajib" }, { status: 400 })

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email))
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 })

    // Validate password strength
    if (password.length < 8)
      return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 })

    // Sanitize name
    const safeName = name ? String(name).trim().slice(0, 100) : null

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing)
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })

    const hashed = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: { name: safeName, email, password: hashed },
    })

    // Don't return the full user object — only confirm success
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Registration error:", err)
    return NextResponse.json({ error: "Gagal registrasi" }, { status: 500 })
  }
}