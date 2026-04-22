-- AlterTable
ALTER TABLE "MataKuliah" ADD COLUMN     "jumlahSesi" INTEGER NOT NULL DEFAULT 8,
ADD COLUMN     "sesiTugasList" TEXT NOT NULL DEFAULT '3,5,7';

-- AlterTable
ALTER TABLE "Semester" ADD COLUMN     "totalSKS" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SesiKuliah" ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;
