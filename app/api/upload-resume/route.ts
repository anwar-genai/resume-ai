import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { devDetail } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

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
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });
    }

    // Read as ArrayBuffer and parse with pdfjs-dist
    const arrayBuffer = await file.arrayBuffer();

    // Verify it's really a PDF (magic bytes "%PDF-"), since file.type is
    // client-supplied and easily spoofed.
    const header = Buffer.from(arrayBuffer.slice(0, 5)).toString("latin1");
    if (header !== "%PDF-") {
      return NextResponse.json({ error: "File is not a valid PDF" }, { status: 400 });
    }
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
        return NextResponse.json({ error: "PDF parsing failed", ...devDetail(e2) }, { status: 500 });
      }
    }

    if (!text) return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 422 });

    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed", ...devDetail(e) }, { status: 500 });
  }
}


