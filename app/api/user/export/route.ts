import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/user/export
// Returns a JSON snapshot of the signed-in user's account + all their documents
// as a file download (data-portability / GDPR "right to access").
export async function GET() {
  const session = await getAuthSession();
  const userId = (session as any)?.userId as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      emailVerified: true,
      plan: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      resumes: {
        select: { id: true, title: true, content: true, optimizedContent: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      coverLetters: {
        select: { id: true, jobTitle: true, company: true, content: true, jobDescription: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      proposals: {
        select: { id: true, projectTitle: true, clientName: true, content: true, projectDetails: true, budget: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndsAt: user.subscriptionEndsAt,
    },
    resumes: user.resumes,
    coverLetters: user.coverLetters,
    proposals: user.proposals,
  };

  const filename = `resume-ai-data-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
