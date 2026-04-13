import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT — Update session data (kehadiran, diskusi, tugas)
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const id = params.id;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership through mataKuliah → semester
  const existing = await prisma.sesiKuliah.findFirst({
    where: { id },
    include: {
      mataKuliah: {
        include: { semester: { select: { userId: true } } },
      },
    },
  });
  if (!existing || existing.mataKuliah.semester.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const updated = await prisma.sesiKuliah.update({
    where: { id },
    data: {
      ...(body.kehadiran !== undefined && { kehadiran: body.kehadiran }),
      ...(body.diskusi !== undefined && {
        diskusi: body.diskusi === null ? null : Number(body.diskusi),
      }),
      ...(body.tugas !== undefined && {
        tugas: body.tugas === null ? null : Number(body.tugas),
      }),
    },
  });

  return NextResponse.json(updated);
}
