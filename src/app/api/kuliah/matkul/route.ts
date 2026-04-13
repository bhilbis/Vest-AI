import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST — Add mata kuliah to semester (auto-creates 8 sessions)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { semesterId, kode, nama, sks, jenis } = await req.json();

  if (!semesterId || !kode || !nama)
    return NextResponse.json(
      { error: "Semester, kode, dan nama wajib diisi" },
      { status: 400 }
    );

  // Verify semester ownership
  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId: session.user.id },
  });
  if (!semester)
    return NextResponse.json(
      { error: "Semester tidak ditemukan" },
      { status: 404 }
    );

  // Create mata kuliah with 8 sessions
  const mataKuliah = await prisma.mataKuliah.create({
    data: {
      kode,
      nama,
      sks: sks || 3,
      jenis: jenis || "reguler",
      semesterId,
      sessions: {
        create: Array.from({ length: 8 }, (_, i) => ({
          sesiNumber: i + 1,
        })),
      },
    },
    include: { sessions: { orderBy: { sesiNumber: "asc" } } },
  });

  return NextResponse.json(mataKuliah, { status: 201 });
}
