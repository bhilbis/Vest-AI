-- CreateTable
CREATE TABLE "ExamPrep" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamPrep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamPrep_userId_idx" ON "ExamPrep"("userId");

-- CreateIndex
CREATE INDEX "ExamPrep_userId_createdAt_idx" ON "ExamPrep"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ExamPrep" ADD CONSTRAINT "ExamPrep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
