import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { blockUser, unblockUser, updateUserLimits } from "@/lib/usage";

// Simple admin functionality - in production, you'd want proper admin role checking
export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Simple admin check - in production, implement proper admin roles
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  if (!adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const { action, userId, reason, resumeLimit, coverLimit } = await request.json();

    switch (action) {
      case 'block':
        if (!userId || !reason) {
          return NextResponse.json({ error: "User ID and reason required" }, { status: 400 });
        }
        await blockUser(userId, reason);
        return NextResponse.json({ message: "User blocked successfully" });

      case 'unblock':
        if (!userId) {
          return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }
        await unblockUser(userId);
        return NextResponse.json({ message: "User unblocked successfully" });

      case 'update_limits':
        if (!userId) {
          return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }
        await updateUserLimits(userId, resumeLimit, coverLimit);
        return NextResponse.json({ message: "User limits updated successfully" });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin action error:', error);
    return NextResponse.json({ error: "Failed to perform admin action" }, { status: 500 });
  }
}

// Get user statistics
export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Simple admin check
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  if (!adminEmails.includes(session.user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (userId) {
      // Get specific user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          createdAt: true,
          resumeCount: true,
          coverCount: true,
          monthlyResumeLimit: true,
          monthlyCoverLimit: true,
          currentPeriodStart: true,
          isBlocked: true,
          blockReason: true,
          _count: {
            select: {
              resumes: true,
              coverLetters: true,
            }
          }
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ user });
    } else {
      // Get general statistics
      const stats = await prisma.user.aggregate({
        _count: true,
        _avg: {
          resumeCount: true,
          coverCount: true,
        },
      });

      const blockedUsers = await prisma.user.count({
        where: { isBlocked: true }
      });

      const unverifiedUsers = await prisma.user.count({
        where: { emailVerified: null }
      });

      return NextResponse.json({
        totalUsers: stats._count,
        blockedUsers,
        unverifiedUsers,
        averageResumeCount: stats._avg.resumeCount,
        averageCoverCount: stats._avg.coverCount,
      });
    }
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
