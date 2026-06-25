-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "currentDayStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dailyCoverCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyResumeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "polarCustomerId" TEXT,
ADD COLUMN     "polarSubscriptionId" TEXT,
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_polarCustomerId_key" ON "public"."User"("polarCustomerId");
