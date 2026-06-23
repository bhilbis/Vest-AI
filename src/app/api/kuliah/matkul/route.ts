import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseSesiTugasList } from "@/lib/kuliah-types";

// POST — Add mata kuliah to semester (auto-creates sessions with hasTugas and diskusiNA set)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    semesterId,
    kode,
    nama,
    sks,
    jenis,
    jumlahSesi: reqJumlahSesi,
    tugaSesiNumbers: reqTugaSesiNumbers,
    diskusiSesiNumbers: reqDiskusiSesiNumbers,
    zoomSesiNumbers: reqZoomSesiNumbers,
    sesiTugasList: reqSesiTugasList,
    gradingPresetId,
    gradingOverride,
  } = await req.json();

  if (!semesterId || !kode || !nama)
    return NextResponse.json(
      { error: "Semester, kode, dan nama wajib diisi" },
      { status: 400 }
    );

  const semester = await prisma.semester.findFirst({
    where: { id: semesterId, userId: session.user.id },
  });
  if (!semester)
    return NextResponse.json({ error: "Semester tidak ditemukan" }, { status: 404 });

  const resolvedJenis: string = jenis || "reguler";
  const jumlahSesi = reqJumlahSesi || (resolvedJenis === "tuweb" ? 15 : 8);

  const defaultTugasList = resolvedJenis === "tuweb" ? "4,8,12" : "3,5,7";
  const tugaSesiNumbers: number[] =
    reqTugaSesiNumbers ?? parseSesiTugasList(reqSesiTugasList ?? defaultTugasList);

  const sesiTugasList =
    reqSesiTugasList ?? tugaSesiNumbers.join(",") ?? defaultTugasList;

  const diskusiSesiNumbers: number[] | null = reqDiskusiSesiNumbers ?? null;
  const zoomSesiNumbers: number[] | null = reqZoomSesiNumbers ?? null;

  const mataKuliah = await prisma.mataKuliah.create({
    data: {
      kode,
      nama,
      sks: sks || 3,
      jenis: resolvedJenis,
      jumlahSesi,
      sesiTugasList,
      ...(gradingPresetId ? { gradingPresetId } : {}),
      ...(gradingOverride ? { gradingOverride } : {}),
      semesterId,
      sessions: {
        create: Array.from({ length: jumlahSesi }, (_, i) => {
          const sesiNumber = i + 1;
          const hasTugas = tugaSesiNumbers.includes(sesiNumber);
          // For tuweb with explicit diskusi config: sessions not in diskusiSesiNumbers → diskusiNA=true
          const diskusiNA =
            resolvedJenis === "tuweb" && diskusiSesiNumbers !== null
              ? !hasTugas && !diskusiSesiNumbers.includes(sesiNumber)
              : false;
          const hasZoom =
            resolvedJenis === "tuweb" && zoomSesiNumbers !== null
              ? zoomSesiNumbers.includes(sesiNumber)
              : false;
          return { sesiNumber, hasTugas, diskusiNA, hasZoom };
        }),
      },
    },
    include: { sessions: { orderBy: { sesiNumber: "asc" } } },
  });

  return NextResponse.json(mataKuliah, { status: 201 });
}
