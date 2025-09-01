import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";

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
    let document;
    
    switch (type) {
      case "resume":
        document = await prisma.resume.findFirst({
          where: { id, userId },
        });
        break;
      
      case "cover":
        document = await prisma.coverLetter.findFirst({
          where: { id, userId },
        });
        break;
      
      case "proposal":
        document = await prisma.proposal.findFirst({
          where: { id, userId },
        });
        break;
      
      default:
        return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      content: document.content,
      metadata: {
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      }
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}
