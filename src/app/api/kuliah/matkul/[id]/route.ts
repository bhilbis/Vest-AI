import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseSesiTugasList } from "@/lib/kuliah-types";

// PUT — Update mata kuliah
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const id = params.id;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.mataKuliah.findFirst({
    where: { id },
    include: { semester: { select: { userId: true } }, sessions: true },
  });
  if (!existing || existing.semester.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const newJumlahSesi = body.jumlahSesi ?? existing.jumlahSesi;
  const newSesiTugasList = body.sesiTugasList ?? existing.sesiTugasList;
  const resolvedJenis = body.jenis ?? existing.jenis;

  const newTugaSesiNumbers: number[] =
    body.tugaSesiNumbers ?? parseSesiTugasList(newSesiTugasList);
  const tugasListChanged =
    body.tugaSesiNumbers !== undefined || body.sesiTugasList !== undefined;

  const newDiskusiSesiNumbers: number[] | null = body.diskusiSesiNumbers ?? null;
  const diskusiListChanged = body.diskusiSesiNumbers !== undefined;
  const newZoomSesiNumbers: number[] | null = body.zoomSesiNumbers ?? null;
  const zoomListChanged = body.zoomSesiNumbers !== undefined;

  const sessions = existing.sessions;
  const currentMax = sessions.length;
  const jumlahSesiChanged = newJumlahSesi !== existing.jumlahSesi;

  const baseData = {
    ...(body.kode !== undefined && { kode: body.kode }),
    ...(body.nama !== undefined && { nama: body.nama }),
    ...(body.sks !== undefined && { sks: body.sks }),
    ...(body.jenis !== undefined && { jenis: body.jenis }),
    jumlahSesi: newJumlahSesi,
    sesiTugasList: body.tugaSesiNumbers
      ? newTugaSesiNumbers.join(",")
      : newSesiTugasList,
    ...(body.uasJumlahSoal !== undefined && { uasJumlahSoal: body.uasJumlahSoal }),
    ...(body.uasJumlahBenar !== undefined && { uasJumlahBenar: body.uasJumlahBenar }),
    ...("gradingPresetId" in body && { gradingPresetId: body.gradingPresetId }),
    ...("gradingOverride" in body && { gradingOverride: body.gradingOverride }),
  };

  let updated;

  if (jumlahSesiChanged) {
    if (newJumlahSesi > currentMax) {
      updated = await prisma.mataKuliah.update({
        where: { id },
        data: {
          ...baseData,
          sessions: {
            create: Array.from({ length: newJumlahSesi - currentMax }, (_, i) => {
              const sesiNumber = currentMax + i + 1;
              const hasTugas = newTugaSesiNumbers.includes(sesiNumber);
              const diskusiNA =
                resolvedJenis === "tuweb" && newDiskusiSesiNumbers !== null
                  ? !hasTugas && !newDiskusiSesiNumbers.includes(sesiNumber)
                  : false;
              const hasZoom =
                resolvedJenis === "tuweb" && newZoomSesiNumbers !== null
                  ? newZoomSesiNumbers.includes(sesiNumber)
                  : false;
              return { sesiNumber, hasTugas, diskusiNA, hasZoom };
            }),
          },
        },
        include: { sessions: { orderBy: { sesiNumber: "asc" } } },
      });
    } else {
      const toDelete = sessions
        .filter((s) => s.sesiNumber > newJumlahSesi)
        .map((s) => s.id);
      updated = await prisma.mataKuliah.update({
        where: { id },
        data: {
          ...baseData,
          sessions: { deleteMany: { id: { in: toDelete } } },
        },
        include: { sessions: { orderBy: { sesiNumber: "asc" } } },
      });
    }
  } else {
    updated = await prisma.mataKuliah.update({
      where: { id },
      data: baseData,
      include: { sessions: { orderBy: { sesiNumber: "asc" } } },
    });
  }

  // Sync hasTugas flags when tugas assignment changed
  if (tugasListChanged) {
    await Promise.all(
      (updated.sessions as { id: string; sesiNumber: number }[]).map((s) =>
        prisma.sesiKuliah.update({
          where: { id: s.id },
          data: { hasTugas: newTugaSesiNumbers.includes(s.sesiNumber) },
        })
      )
    );
  }

  // Sync diskusiNA flags for tuweb when diskusi assignment changed
  if (diskusiListChanged && resolvedJenis === "tuweb" && newDiskusiSesiNumbers !== null) {
    await Promise.all(
      (updated.sessions as { id: string; sesiNumber: number }[]).map((s) => {
        const hasTugas = newTugaSesiNumbers.includes(s.sesiNumber);
        const diskusiNA = !hasTugas && !newDiskusiSesiNumbers.includes(s.sesiNumber);
        return prisma.sesiKuliah.update({
          where: { id: s.id },
          data: { diskusiNA },
        });
      })
    );
  }

  // Sync hasZoom flags for tuweb when zoom assignment changed
  if (zoomListChanged && resolvedJenis === "tuweb" && newZoomSesiNumbers !== null) {
    await Promise.all(
      (updated.sessions as { id: string; sesiNumber: number }[]).map((s) =>
        prisma.sesiKuliah.update({
          where: { id: s.id },
          data: { hasZoom: newZoomSesiNumbers.includes(s.sesiNumber) },
        })
      )
    );
  }

  // Re-fetch if any flags were synced
  if (tugasListChanged || diskusiListChanged || zoomListChanged) {
    updated = await prisma.mataKuliah.findUnique({
      where: { id },
      include: { sessions: { orderBy: { sesiNumber: "asc" } } },
    });
  }

  return NextResponse.json(updated);
}

// DELETE — Delete mata kuliah (cascades sessions)
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const id = params.id;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.mataKuliah.findFirst({
    where: { id },
    include: { semester: { select: { userId: true } } },
  });
  if (!existing || existing.semester.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.mataKuliah.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
