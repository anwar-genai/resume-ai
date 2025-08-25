import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

interface Params { params: { id: string } }

export async function GET(_: Request, { params }: Params) {
  const session = await getAuthSession();
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session as any).userId as string;
  const doc = await prisma.coverLetter.findUnique({ where: { id: params.id } });
  if (!doc || doc.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const text = doc.content;
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename=cover-${doc.id}.txt`,
    },
  });
}


