import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET — List all semesters for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const semesters = await prisma.semester.findMany({
    where: { userId: session.user.id },
    include: {
      mataKuliah: {
        include: { sessions: { orderBy: { sesiNumber: "asc" } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(semesters);
}

// POST — Create a new semester
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nama, tanggalMulai, totalSKS } = await req.json();

  if (!nama || !tanggalMulai)
    return NextResponse.json(
      { error: "Nama dan tanggal mulai wajib diisi" },
      { status: 400 }
    );

  const semester = await prisma.semester.create({
    data: {
      nama,
      tanggalMulai: new Date(tanggalMulai),
      totalSKS: totalSKS ? Number(totalSKS) : 0,
      userId: session.user.id,
    },
    include: {
      mataKuliah: {
        include: { sessions: { orderBy: { sesiNumber: "asc" } } },
      },
    },
  });

  return NextResponse.json(semester, { status: 201 });
}
