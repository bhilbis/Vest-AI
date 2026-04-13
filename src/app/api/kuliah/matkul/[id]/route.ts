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

  const updated = await prisma.mataKuliah.update({
    where: { id },
    data: {
      ...(body.kode !== undefined && { kode: body.kode }),
      ...(body.nama !== undefined && { nama: body.nama }),
      ...(body.sks !== undefined && { sks: body.sks }),
      ...(body.jenis !== undefined && { jenis: body.jenis }),
      ...(body.uasJumlahSoal !== undefined && {
        uasJumlahSoal: body.uasJumlahSoal,
      }),
      ...(body.uasJumlahBenar !== undefined && {
        uasJumlahBenar: body.uasJumlahBenar,
      }),
    },
    include: { sessions: { orderBy: { sesiNumber: "asc" } } },
  });

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
