import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { checkUsageLimit } from "@/lib/usage";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user?.email || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = (session as any).userId as string;
    
    // Get usage for both resume and cover letter
    const [resumeUsage, coverUsage] = await Promise.all([
      checkUsageLimit(userId, 'resume'),
      checkUsageLimit(userId, 'cover')
    ]);

    return NextResponse.json({
      resume: {
        remaining: resumeUsage.remainingResumes,
        periodEnd: resumeUsage.periodEnd,
        canProceed: resumeUsage.canProceed,
      },
      cover: {
        remaining: coverUsage.remainingCovers,
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
