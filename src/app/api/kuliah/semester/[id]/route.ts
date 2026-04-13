import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT — Update semester
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const id = params.id;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.semester.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { nama, tanggalMulai, isActive } = await req.json();

  const updated = await prisma.semester.update({
    where: { id },
    data: {
      ...(nama !== undefined && { nama }),
      ...(tanggalMulai !== undefined && {
        tanggalMulai: new Date(tanggalMulai),
      }),
      ...(isActive !== undefined && { isActive }),
    },
    include: {
      mataKuliah: {
        include: { sessions: { orderBy: { sesiNumber: "asc" } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json(updated);
}

// DELETE — Delete semester (cascades to mataKuliah + sessions)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await context.params;
  const id = params.id;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.semester.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.semester.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
