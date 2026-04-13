import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DEFAULT_SETTINGS = {
  bobotKehadiran: 20,
  bobotDiskusi: 30,
  bobotTugas: 50,
  kontribusiUAS: 70,
  kontribusiTuton: 30,
  kontribusiDiskusiPraktik: 50,
  kontribusiTugasPraktik: 50,
  batasA: 80,
  batasB: 70,
  batasC: 56,
  batasD: 45,
};

// GET — Get user settings (or return defaults)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.kuliahSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(settings || { ...DEFAULT_SETTINGS, userId: session.user.id });
}

// PUT — Update settings
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const settings = await prisma.kuliahSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...DEFAULT_SETTINGS,
      ...body,
    },
    update: body,
  });

  return NextResponse.json(settings);
}
