import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL_NAME = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key missing" }, { status: 500 });
    }
    const { resume, jobDescription, title } = await request.json();
    if (!resume || typeof resume !== "string") {
      return NextResponse.json({ error: "Invalid resume content" }, { status: 400 });
    }

    const context = jobDescription ? `Match the improvements to the following job description. Prioritize relevant keywords and responsibilities that are genuinely supported by the resume.\n\nJOB DESCRIPTION:\n${jobDescription}\n\n` : "";
    const prompt = `You are an expert ATS resume optimizer. Improve the following resume for ATS scanning, clarity, impact, and specificity. Only include keywords the candidate's experience truly supports. Keep original chronology, avoid fabrications, and return only improved resume text.\n\n${context}RESUME:\n${resume}`;

    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You optimize resumes for ATS and clarity." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    const optimized = completion.choices?.[0]?.message?.content?.trim();
    if (!optimized) {
      return NextResponse.json({ error: "No content generated" }, { status: 502 });
    }

    const userId = (session as any).userId as string;
    const saved = await prisma.resume.create({
      data: { userId, title: title?.slice(0, 120) ?? null, content: resume, optimizedContent: optimized },
    });

    return NextResponse.json({ id: saved.id, optimized: optimized });
  } catch (error: any) {
    return NextResponse.json({ error: "Generation failed", detail: error?.message ?? "" }, { status: 500 });
  }
}


