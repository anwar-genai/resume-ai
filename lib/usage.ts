import prisma from '@/lib/db';
import { planLimits, PERIOD_DAYS, DocType } from '@/lib/plans';

export interface UsageCheck {
  canProceed: boolean;
  remaining: number;       // weekly remaining for the requested type
  remainingDaily: number;  // daily remaining for the requested type
  periodEnd: Date;         // when the weekly window resets
  plan: string;
  isBlocked: boolean;
  blockReason?: string;
}

// Column names for each document type's weekly + daily counters.
const FIELDS: Record<DocType, { weekly: keyof CounterRow; daily: keyof CounterRow }> = {
  resume: { weekly: 'resumeCount', daily: 'dailyResumeCount' },
  cover: { weekly: 'coverCount', daily: 'dailyCoverCount' },
  proposal: { weekly: 'proposalCount', daily: 'dailyProposalCount' },
};

interface CounterRow {
  resumeCount: number;
  coverCount: number;
  proposalCount: number;
  dailyResumeCount: number;
  dailyCoverCount: number;
  dailyProposalCount: number;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function checkUsageLimit(userId: string, type: DocType): Promise<UsageCheck> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      resumeCount: true,
      coverCount: true,
      proposalCount: true,
      dailyResumeCount: true,
      dailyCoverCount: true,
      dailyProposalCount: true,
      currentPeriodStart: true,
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

  if (user.isBlocked) {
    return {
      canProceed: false,
      remaining: 0,
      remainingDaily: 0,
      periodEnd: new Date(),
      plan: user.plan,
      isBlocked: true,
      blockReason: user.blockReason || 'Account blocked',
    };
  }

  const now = new Date();

  // ----- Weekly reset (if the period has elapsed) -----
  let currentPeriodStart = new Date(user.currentPeriodStart);
  const periodEndCandidate = addDays(currentPeriodStart, PERIOD_DAYS);
  const counts: CounterRow = {
    resumeCount: user.resumeCount,
    coverCount: user.coverCount,
    proposalCount: user.proposalCount,
    dailyResumeCount: user.dailyResumeCount,
    dailyCoverCount: user.dailyCoverCount,
    dailyProposalCount: user.dailyProposalCount,
  };

  if (now >= periodEndCandidate) {
    counts.resumeCount = 0;
    counts.coverCount = 0;
    counts.proposalCount = 0;
    currentPeriodStart = now;
    await prisma.user.update({
      where: { id: userId },
      data: { resumeCount: 0, coverCount: 0, proposalCount: 0, currentPeriodStart: now },
    });
  }

  // ----- Daily reset (if the calendar day has changed) -----
  if (!isSameCalendarDay(now, new Date(user.currentDayStart))) {
    counts.dailyResumeCount = 0;
    counts.dailyCoverCount = 0;
    counts.dailyProposalCount = 0;
    await prisma.user.update({
      where: { id: userId },
      data: {
        dailyResumeCount: 0,
        dailyCoverCount: 0,
        dailyProposalCount: 0,
        currentDayStart: now,
      },
    });
  }

  const field = FIELDS[type];
  const remaining = Math.max(0, limits.weekly - (counts[field.weekly] as number));
  const remainingDaily = Math.max(0, limits.daily - (counts[field.daily] as number));

  return {
    canProceed: remaining > 0 && remainingDaily > 0,
    remaining,
    remainingDaily,
    periodEnd: addDays(currentPeriodStart, PERIOD_DAYS),
    plan: user.plan,
    isBlocked: false,
  };
}

export async function incrementUsage(userId: string, type: DocType): Promise<void> {
  const field = FIELDS[type];
  await prisma.user.update({
    where: { id: userId },
    data: {
      [field.weekly]: { increment: 1 },
      [field.daily]: { increment: 1 },
    },
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
