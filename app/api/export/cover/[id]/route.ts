import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { generatePDF, generateDOCX } from "@/lib/pdf-generator";

interface Params { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = (session as any).userId as string;
  const doc = await prisma.coverLetter.findUnique({ where: { id } });
  
  if (!doc || doc.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const text = doc.content;
  const format = request.nextUrl.searchParams.get("format") || "txt";
  const filename = `cover-letter-${doc.company}-${doc.jobTitle}`.replace(/\s+/g, "-");

  switch (format) {
    case "pdf": {
      const pdfBlob = generatePDF(text, `Cover Letter - ${doc.jobTitle} at ${doc.company}`);
      return new NextResponse(pdfBlob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    }
    
    case "docx": {
      const docxBlob = generateDOCX(text, `Cover Letter - ${doc.jobTitle} at ${doc.company}`);
      return new NextResponse(docxBlob, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}.docx"`,
        },
      });
    }
    
    default: {
      return new NextResponse(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.txt"`,
        },
      });
    }
  }
}