import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST — Add mata kuliah to semester (auto-creates sessions based on jenis)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { semesterId, kode, nama, sks, jenis, jumlahSesi: reqJumlahSesi, sesiTugasList: reqSesiTugasList } = await req.json();

  if (!semesterId || !kode || !nama)
    return NextResponse.json(
      { error: "Semester, kode, dan nama wajib diisi" },
      { status: 400 }
    );

  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId: session.user.id },
  });
  if (!semester)
    return NextResponse.json(
      { error: "Semester tidak ditemukan" },
      { status: 404 }
    );

  const resolvedJenis: string = jenis || "reguler";

  // Use provided values or defaults based on jenis
  const jumlahSesi = reqJumlahSesi || (resolvedJenis === "tuweb" ? 15 : 8);
  const sesiTugasList = reqSesiTugasList || (resolvedJenis === "tuweb" ? "4,8,12" : "3,5,7");

  const mataKuliah = await prisma.mataKuliah.create({
    data: {
      kode,
      nama,
      sks: sks || 3,
      jenis: resolvedJenis,
      jumlahSesi,
      sesiTugasList,
      semesterId,
      sessions: {
        create: Array.from({ length: jumlahSesi }, (_, i) => ({
          sesiNumber: i + 1,
        })),
      },
    },
    include: { sessions: { orderBy: { sesiNumber: "asc" } } },
  });

  return NextResponse.json(mataKuliah, { status: 201 });
}
