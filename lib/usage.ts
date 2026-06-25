import prisma from '@/lib/db';
import { planLimits } from '@/lib/plans';

export interface UsageCheck {
  canProceed: boolean;
  remainingResumes: number;       // monthly remaining
  remainingCovers: number;        // monthly remaining
  remainingDailyResumes: number;  // daily remaining
  remainingDailyCovers: number;   // daily remaining
  periodEnd: Date;
  plan: string;
  isBlocked: boolean;
  blockReason?: string;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function checkUsageLimit(userId: string, type: 'resume' | 'cover'): Promise<UsageCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      resumeCount: true,
      coverCount: true,
      monthlyResumeLimit: true,
      monthlyCoverLimit: true,
      currentPeriodStart: true,
      dailyResumeCount: true,
      dailyCoverCount: true,
      currentDayStart: true,
      plan: true,
      isBlocked: true,
      blockReason: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const limits = planLimits(user.plan);

  // Check if user is blocked
  if (user.isBlocked) {
    return {
      canProceed: false,
      remainingResumes: 0,
      remainingCovers: 0,
      remainingDailyResumes: 0,
      remainingDailyCovers: 0,
      periodEnd: new Date(),
      plan: user.plan,
      isBlocked: true,
      blockReason: user.blockReason || 'Account blocked',
    };
  }

  const now = new Date();

  // ----- Monthly reset (if a month has passed) -----
  const periodStart = new Date(user.currentPeriodStart);
  const oneMonthLater = new Date(periodStart);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  let resumeCount = user.resumeCount;
  let coverCount = user.coverCount;
  let currentPeriodStart = user.currentPeriodStart;

  if (now >= oneMonthLater) {
    resumeCount = 0;
    coverCount = 0;
    currentPeriodStart = now;
    await prisma.user.update({
      where: { id: userId },
      data: { resumeCount: 0, coverCount: 0, currentPeriodStart: now },
    });
  }

  // ----- Daily reset (if the calendar day has changed) -----
  let dailyResumeCount = user.dailyResumeCount;
  let dailyCoverCount = user.dailyCoverCount;

  if (!isSameCalendarDay(now, new Date(user.currentDayStart))) {
    dailyResumeCount = 0;
    dailyCoverCount = 0;
    await prisma.user.update({
      where: { id: userId },
      data: { dailyResumeCount: 0, dailyCoverCount: 0, currentDayStart: now },
    });
  }

  const remainingResumes = Math.max(0, user.monthlyResumeLimit - resumeCount);
  const remainingCovers = Math.max(0, user.monthlyCoverLimit - coverCount);
  const remainingDailyResumes = Math.max(0, limits.dailyResume - dailyResumeCount);
  const remainingDailyCovers = Math.max(0, limits.dailyCover - dailyCoverCount);

  const nextPeriodEnd = new Date(currentPeriodStart);
  nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

  // Can proceed only if BOTH the monthly and daily budgets have room.
  let canProceed = false;
  if (type === 'resume') {
    canProceed = remainingResumes > 0 && remainingDailyResumes > 0;
  } else if (type === 'cover') {
    canProceed = remainingCovers > 0 && remainingDailyCovers > 0;
  }

  return {
    canProceed,
    remainingResumes,
    remainingCovers,
    remainingDailyResumes,
    remainingDailyCovers,
    periodEnd: nextPeriodEnd,
    plan: user.plan,
    isBlocked: false,
  };
}

export async function incrementUsage(userId: string, type: 'resume' | 'cover'): Promise<void> {
  const updateData =
    type === 'resume'
      ? { resumeCount: { increment: 1 }, dailyResumeCount: { increment: 1 } }
      : { coverCount: { increment: 1 }, dailyCoverCount: { increment: 1 } };

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
}

export async function blockUser(userId: string, reason: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isBlocked: true,
      blockReason: reason,
    },
  });
}

export async function unblockUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      isBlocked: false,
      blockReason: null,
    },
  });
}

export async function updateUserLimits(
  userId: string,
  resumeLimit?: number,
  coverLimit?: number
): Promise<void> {
  const updateData: { monthlyResumeLimit?: number; monthlyCoverLimit?: number } = {};

  if (resumeLimit !== undefined) {
    updateData.monthlyResumeLimit = resumeLimit;
  }

  if (coverLimit !== undefined) {
    updateData.monthlyCoverLimit = coverLimit;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }
}
