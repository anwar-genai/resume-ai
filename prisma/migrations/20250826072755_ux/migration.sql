-- AlterTable
ALTER TABLE "public"."CoverLetter" ADD COLUMN     "jobDescription" TEXT,
ADD COLUMN     "resumeId" TEXT;

-- AlterTable
ALTER TABLE "public"."Resume" ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE INDEX "CoverLetter_resumeId_idx" ON "public"."CoverLetter"("resumeId");

-- AddForeignKey
ALTER TABLE "public"."CoverLetter" ADD CONSTRAINT "CoverLetter_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "public"."Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
