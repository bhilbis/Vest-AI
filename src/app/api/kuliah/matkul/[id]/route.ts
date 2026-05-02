import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT — Update mata kuliah (kode, nama, sks, jenis, UAS data)
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const id = params.id;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership through semester
  const existing = await prisma.mataKuliah.findFirst({
    where: { id },
    include: { semester: { select: { userId: true } } },
  });
  if (!existing || existing.semester.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const oldData = await prisma.mataKuliah.findFirst({
    where: { id },
    include: { sessions: true },
  });
  if (!oldData) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const newJumlahSesi = body.jumlahSesi ?? oldData.jumlahSesi;
  const newSesiTugasList = body.sesiTugasList ?? oldData.sesiTugasList;

  let updated;

  if (newJumlahSesi !== oldData.jumlahSesi) {
    const sessions = oldData.sessions;
    const currentMax = sessions.length;

    if (newJumlahSesi > currentMax) {
      const sessionsToCreate = Array.from(
        { length: newJumlahSesi - currentMax },
        (_, i) => ({
          sesiNumber: currentMax + i + 1,
        })
      );

      updated = await prisma.mataKuliah.update({
        where: { id },
        data: {
          ...(body.kode !== undefined && { kode: body.kode }),
          ...(body.nama !== undefined && { nama: body.nama }),
          ...(body.sks !== undefined && { sks: body.sks }),
          ...(body.jenis !== undefined && { jenis: body.jenis }),
          jumlahSesi: newJumlahSesi,
          sesiTugasList: newSesiTugasList,
          ...(body.uasJumlahSoal !== undefined && {
            uasJumlahSoal: body.uasJumlahSoal,
          }),
          ...(body.uasJumlahBenar !== undefined && {
            uasJumlahBenar: body.uasJumlahBenar,
          }),
          sessions: {
            create: sessionsToCreate,
          },
        },
        include: { sessions: { orderBy: { sesiNumber: "asc" } } },
      });
    } else {
      const sessionsToDelete = sessions
        .filter((s) => s.sesiNumber > newJumlahSesi)
        .map((s) => s.id);

      updated = await prisma.mataKuliah.update({
        where: { id },
        data: {
          ...(body.kode !== undefined && { kode: body.kode }),
          ...(body.nama !== undefined && { nama: body.nama }),
          ...(body.sks !== undefined && { sks: body.sks }),
          ...(body.jenis !== undefined && { jenis: body.jenis }),
          jumlahSesi: newJumlahSesi,
          sesiTugasList: newSesiTugasList,
          ...(body.uasJumlahSoal !== undefined && {
            uasJumlahSoal: body.uasJumlahSoal,
          }),
          ...(body.uasJumlahBenar !== undefined && {
            uasJumlahBenar: body.uasJumlahBenar,
          }),
          sessions: {
            deleteMany: { id: { in: sessionsToDelete } },
          },
        },
        include: { sessions: { orderBy: { sesiNumber: "asc" } } },
      });
    }
  } else {
    updated = await prisma.mataKuliah.update({
      where: { id },
      data: {
        ...(body.kode !== undefined && { kode: body.kode }),
        ...(body.nama !== undefined && { nama: body.nama }),
        ...(body.sks !== undefined && { sks: body.sks }),
        ...(body.jenis !== undefined && { jenis: body.jenis }),
        jumlahSesi: newJumlahSesi,
        sesiTugasList: newSesiTugasList,
        ...(body.uasJumlahSoal !== undefined && {
          uasJumlahSoal: body.uasJumlahSoal,
        }),
        ...(body.uasJumlahBenar !== undefined && {
          uasJumlahBenar: body.uasJumlahBenar,
        }),
      },
      include: { sessions: { orderBy: { sesiNumber: "asc" } } },
    });
  }

  return NextResponse.json(updated);
}

// DELETE — Delete mata kuliah (cascades sessions)
export async function DELETE(
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
    include: { semester: { select: { userId: true } } },
  });
  if (!existing || existing.semester.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.mataKuliah.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
