import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { resumeDataSchema, isTemplateId } from "@/lib/resumeSchema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;
  const { type, id } = await params;

  try {
    switch (type) {
      case "resume": {
        const document = await prisma.resume.findFirst({ where: { id, userId } });
        if (!document) {
          return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }
        // Prefer structured data so the modal can render the real template
        // (one-column ATS / two-column Modern) instead of raw text.
        const parsed = document.structuredContent
          ? resumeDataSchema.safeParse(document.structuredContent)
          : null;
        return NextResponse.json({
          content: document.optimizedContent ?? document.content,
          data: parsed?.success ? parsed.data : null,
          template: isTemplateId(document.template) ? document.template : "ats",
          metadata: { createdAt: document.createdAt },
        });
      }

      case "cover": {
        const document = await prisma.coverLetter.findFirst({ where: { id, userId } });
        if (!document) {
          return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }
        return NextResponse.json({
          content: document.content,
          metadata: { createdAt: document.createdAt },
        });
      }

      case "proposal": {
        const document = await prisma.proposal.findFirst({ where: { id, userId } });
        if (!document) {
          return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }
        return NextResponse.json({
          content: document.content,
          metadata: { createdAt: document.createdAt },
        });
      }

      default:
        return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}
