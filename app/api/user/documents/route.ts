import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;
  const type = request.nextUrl.searchParams.get("type");

  try {
    switch (type) {
      case "resumes":
        const resumes = await prisma.resume.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(resumes);

      case "covers":
        const covers = await prisma.coverLetter.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          include: { resume: true },
        });
        return NextResponse.json(covers);

      case "proposals":
        const proposals = await prisma.proposal.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          include: { resume: true },
        });
        return NextResponse.json(proposals);

      default:
        return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}
