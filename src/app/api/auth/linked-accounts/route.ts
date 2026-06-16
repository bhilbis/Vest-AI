import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET — return current user's linked providers and whether they have a password
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      password: true,
      accounts: { select: { provider: true, id: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    hasPassword: !!user.password,
    providers: user.accounts.map((a) => ({ provider: a.provider, id: a.id })),
  });
}

// POST — set or update password (link credentials)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { password, currentPassword } = await req.json();

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // If user already has a password, require current password to change it
  if (user.password) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Password saat ini diperlukan" }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 });
    }
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  return NextResponse.json({ success: true });
}

// DELETE — unlink a provider account (only if user has another login method)
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider } = await req.json();
  if (!provider) {
    return NextResponse.json({ error: "Provider diperlukan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, accounts: { select: { id: true, provider: true } } },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const accountToRemove = user.accounts.find((a) => a.provider === provider);
  if (!accountToRemove) {
    return NextResponse.json({ error: "Provider tidak ditemukan" }, { status: 404 });
  }

  // Ensure they still have another way to log in
  const remainingProviders = user.accounts.filter((a) => a.provider !== provider);
  if (remainingProviders.length === 0 && !user.password) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus satu-satunya metode login. Tambahkan password terlebih dahulu." },
      { status: 400 }
    );
  }

  await prisma.account.delete({ where: { id: accountToRemove.id } });

  return NextResponse.json({ success: true });
}
