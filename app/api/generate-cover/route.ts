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
    const { jobTitle, company } = await request.json();
    if (!jobTitle || !company) {
      return NextResponse.json({ error: "Missing jobTitle or company" }, { status: 400 });
    }

    const userId = (session as any).userId as string;
    const latestResume = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const resumeText = latestResume?.optimizedContent || latestResume?.content || "";
    if (!resumeText) {
      return NextResponse.json({ error: "No resume found" }, { status: 400 });
    }

    const prompt = `Write a concise, tailored cover letter (max ~350 words) for the role of ${jobTitle} at ${company}. Use the candidate's resume below. Be specific, avoid clichés, and align skills with the role.\n\nRESUME:\n${resumeText}`;

    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are a professional cover letter writer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });

    const letter = completion.choices?.[0]?.message?.content?.trim();
    if (!letter) {
      return NextResponse.json({ error: "No content generated" }, { status: 502 });
    }

    const saved = await prisma.coverLetter.create({
      data: { userId, jobTitle, company, content: letter },
    });

    return NextResponse.json({ id: saved.id, content: letter });
  } catch (error: any) {
    return NextResponse.json({ error: "Generation failed", detail: error?.message ?? "" }, { status: 500 });
  }
}


