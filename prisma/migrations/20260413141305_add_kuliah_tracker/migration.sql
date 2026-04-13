-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MataKuliah" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "sks" INTEGER NOT NULL DEFAULT 3,
    "jenis" TEXT NOT NULL DEFAULT 'reguler',
    "semesterId" TEXT NOT NULL,
    "uasJumlahSoal" INTEGER NOT NULL DEFAULT 0,
    "uasJumlahBenar" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MataKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SesiKuliah" (
    "id" TEXT NOT NULL,
    "sesiNumber" INTEGER NOT NULL,
    "kehadiran" BOOLEAN NOT NULL DEFAULT false,
    "diskusi" DOUBLE PRECISION,
    "tugas" DOUBLE PRECISION,
    "mataKuliahId" TEXT NOT NULL,

    CONSTRAINT "SesiKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KuliahSettings" (
    "id" TEXT NOT NULL,
    "bobotKehadiran" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "bobotDiskusi" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "bobotTugas" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "kontribusiUAS" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "kontribusiTuton" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "kontribusiDiskusiPraktik" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "kontribusiTugasPraktik" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "batasA" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "batasB" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "batasC" DOUBLE PRECISION NOT NULL DEFAULT 56,
    "batasD" DOUBLE PRECISION NOT NULL DEFAULT 45,
    "userId" TEXT NOT NULL,

    CONSTRAINT "KuliahSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Semester_userId_idx" ON "Semester"("userId");

-- CreateIndex
CREATE INDEX "MataKuliah_semesterId_idx" ON "MataKuliah"("semesterId");

-- CreateIndex
CREATE INDEX "SesiKuliah_mataKuliahId_idx" ON "SesiKuliah"("mataKuliahId");

-- CreateIndex
CREATE UNIQUE INDEX "SesiKuliah_mataKuliahId_sesiNumber_key" ON "SesiKuliah"("mataKuliahId", "sesiNumber");

-- CreateIndex
CREATE UNIQUE INDEX "KuliahSettings_userId_key" ON "KuliahSettings"("userId");

-- CreateIndex
CREATE INDEX "KuliahSettings_userId_idx" ON "KuliahSettings"("userId");

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MataKuliah" ADD CONSTRAINT "MataKuliah_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesiKuliah" ADD CONSTRAINT "SesiKuliah_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KuliahSettings" ADD CONSTRAINT "KuliahSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
