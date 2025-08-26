import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type || !file.type.includes("pdf")) {
      return NextResponse.json({ error: "Only PDF files supported" }, { status: 400 });
    }

    // Read as ArrayBuffer and parse with pdfjs-dist
    const arrayBuffer = await file.arrayBuffer();
    // Prefer pdf-parse direct library path to avoid bundling test fixtures
    try {
      const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await pdfParse(buffer);
      const text = parsed.text?.trim() || "";
      if (!text) return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 422 });
      return NextResponse.json({ text });
    } catch (e1) {
      try {
        const { default: pdfParse } = await import("pdf-parse");
        const buffer = Buffer.from(arrayBuffer);
        const parsed = await pdfParse(buffer);
        const text = parsed.text?.trim() || "";
        if (!text) return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 422 });
        return NextResponse.json({ text });
      } catch (e2) {
        console.error("All PDF extraction methods failed", e1, e2);
        return NextResponse.json({ error: "PDF parsing failed", detail: (e2 as any)?.message ?? String(e2) }, { status: 500 });
      }
    }

    if (!text) return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 422 });

    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed", detail: e?.message ?? String(e) }, { status: 500 });
  }
}


