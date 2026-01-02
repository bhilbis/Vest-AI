import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password)
      return NextResponse.json({ error: "Email & password wajib" }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing)
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 })

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name, email, password: hashed },
    })

    return NextResponse.json({ success: true, user })
  } catch (err) {
    console.error("Registration error:", err)
    return NextResponse.json({ error: "Gagal registrasi" }, { status: 500 })
  }
}