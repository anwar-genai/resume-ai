-- Move to plan-driven weekly limits + a dedicated proposal quota.
--
-- Per-user stored monthly limits are removed: allowances are now read from
-- lib/plans.ts by plan. Proposals get their own counters instead of sharing the
-- cover-letter quota.

ALTER TABLE "User" DROP COLUMN IF EXISTS "monthlyResumeLimit";
ALTER TABLE "User" DROP COLUMN IF EXISTS "monthlyCoverLimit";

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "proposalCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyProposalCount" INTEGER NOT NULL DEFAULT 0;
