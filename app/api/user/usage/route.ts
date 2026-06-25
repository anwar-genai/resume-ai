import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { checkUsageLimit } from "@/lib/usage";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.email || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = (session as any).userId as string;

    // Get usage for both resume and cover letter
    const [resumeUsage, coverUsage, sub] = await Promise.all([
      checkUsageLimit(userId, 'resume'),
      checkUsageLimit(userId, 'cover'),
      prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionStatus: true, subscriptionEndsAt: true },
      }),
    ]);

    return NextResponse.json({
      plan: resumeUsage.plan,
      subscriptionStatus: sub?.subscriptionStatus ?? null,
      subscriptionEndsAt: sub?.subscriptionEndsAt ?? null,
      resume: {
        remaining: resumeUsage.remainingResumes,
        remainingDaily: resumeUsage.remainingDailyResumes,
        periodEnd: resumeUsage.periodEnd,
        canProceed: resumeUsage.canProceed,
      },
      cover: {
        remaining: coverUsage.remainingCovers,
        remainingDaily: coverUsage.remainingDailyCovers,
        periodEnd: coverUsage.periodEnd,
        canProceed: coverUsage.canProceed,
      },
      isBlocked: resumeUsage.isBlocked,
      blockReason: resumeUsage.blockReason,
    });
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json({ error: "Failed to check usage" }, { status: 500 });
  }
}
