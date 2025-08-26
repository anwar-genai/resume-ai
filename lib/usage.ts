import prisma from '@/lib/db';

export interface UsageCheck {
  canProceed: boolean;
  remainingResumes: number;
  remainingCovers: number;
  periodEnd: Date;
  isBlocked: boolean;
  blockReason?: string;
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
      isBlocked: true,
      blockReason: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Initialize usage fields if they don't exist (for existing users)
  if (user.resumeCount === null || user.coverCount === null) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        resumeCount: 0,
        coverCount: 0,
        monthlyResumeLimit: 10,
        monthlyCoverLimit: 10,
        currentPeriodStart: new Date(),
        isBlocked: false,
      },
    });
    
    // Refetch user data
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        resumeCount: true,
        coverCount: true,
        monthlyResumeLimit: true,
        monthlyCoverLimit: true,
        currentPeriodStart: true,
        isBlocked: true,
        blockReason: true,
      },
    });
    
    if (!updatedUser) {
      throw new Error('User not found after update');
    }
    
    return checkUsageLimit(userId, type); // Recursive call with updated data
  }

  // Check if user is blocked
  if (user.isBlocked) {
    return {
      canProceed: false,
      remainingResumes: 0,
      remainingCovers: 0,
      periodEnd: new Date(),
      isBlocked: true,
      blockReason: user.blockReason || 'Account blocked',
    };
  }

  // Check if we need to reset monthly limits (if a month has passed)
  const now = new Date();
  const periodStart = new Date(user.currentPeriodStart);
  const oneMonthLater = new Date(periodStart);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  let currentResumeCount = user.resumeCount;
  let currentCoverCount = user.coverCount;
  let currentPeriodStart = user.currentPeriodStart;

  // Reset counts if period has expired
  if (now >= oneMonthLater) {
    currentResumeCount = 0;
    currentCoverCount = 0;
    currentPeriodStart = now;
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        resumeCount: 0,
        coverCount: 0,
        currentPeriodStart: now,
      },
    });
  }

  const remainingResumes = Math.max(0, user.monthlyResumeLimit - currentResumeCount);
  const remainingCovers = Math.max(0, user.monthlyCoverLimit - currentCoverCount);

  // Calculate next period end
  const nextPeriodEnd = new Date(currentPeriodStart);
  nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

  // Check if user can proceed with this request
  let canProceed = false;
  if (type === 'resume') {
    canProceed = remainingResumes > 0;
  } else if (type === 'cover') {
    canProceed = remainingCovers > 0;
  }

  return {
    canProceed,
    remainingResumes,
    remainingCovers,
    periodEnd: nextPeriodEnd,
    isBlocked: false,
  };
}

export async function incrementUsage(userId: string, type: 'resume' | 'cover'): Promise<void> {
  const updateData = type === 'resume' 
    ? { resumeCount: { increment: 1 } }
    : { coverCount: { increment: 1 } };

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
