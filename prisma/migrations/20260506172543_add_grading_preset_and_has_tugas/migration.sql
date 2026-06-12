-- AlterTable
ALTER TABLE "MataKuliah" ADD COLUMN     "gradingOverride" JSONB,
ADD COLUMN     "gradingPresetId" TEXT;

-- AlterTable
ALTER TABLE "SesiKuliah" ADD COLUMN     "hasTugas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tugasDeadline" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GradingPreset" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "schemeJson" JSONB NOT NULL,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradingPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradingPreset_ownerId_idx" ON "GradingPreset"("ownerId");

-- CreateIndex
CREATE INDEX "GradingPreset_isPublic_idx" ON "GradingPreset"("isPublic");

-- CreateIndex
CREATE INDEX "MataKuliah_gradingPresetId_idx" ON "MataKuliah"("gradingPresetId");

-- AddForeignKey
ALTER TABLE "MataKuliah" ADD CONSTRAINT "MataKuliah_gradingPresetId_fkey" FOREIGN KEY ("gradingPresetId") REFERENCES "GradingPreset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
