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

    // Get usage for resume, cover letter and proposal
    const [resumeUsage, coverUsage, proposalUsage, sub] = await Promise.all([
      checkUsageLimit(userId, 'resume'),
      checkUsageLimit(userId, 'cover'),
      checkUsageLimit(userId, 'proposal'),
      prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionStatus: true, subscriptionEndsAt: true },
      }),
    ]);

    const shape = (u: typeof resumeUsage) => ({
      remaining: u.remaining,
      remainingDaily: u.remainingDaily,
      periodEnd: u.periodEnd,
      canProceed: u.canProceed,
    });

    return NextResponse.json({
      plan: resumeUsage.plan,
      subscriptionStatus: sub?.subscriptionStatus ?? null,
      subscriptionEndsAt: sub?.subscriptionEndsAt ?? null,
      resume: shape(resumeUsage),
      cover: shape(coverUsage),
      proposal: shape(proposalUsage),
      isBlocked: resumeUsage.isBlocked,
      blockReason: resumeUsage.blockReason,
    });
  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json({ error: "Failed to check usage" }, { status: 500 });
  }
}
