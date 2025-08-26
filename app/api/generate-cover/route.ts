import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";
import OpenAI from "openai";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL_NAME = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;
  
  // Check usage limits before processing
  const usageCheck = await checkUsageLimit(userId, 'cover');
  
  if (!usageCheck.canProceed) {
    if (usageCheck.isBlocked) {
      return NextResponse.json(
        { 
          error: 'Account blocked',
          reason: usageCheck.blockReason,
          blocked: true
        }, 
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: `Monthly cover letter limit reached (${usageCheck.remainingCovers} remaining)`,
        usage: {
          remaining: usageCheck.remainingCovers,
          periodEnd: usageCheck.periodEnd,
          type: 'cover letter'
        },
        limitReached: true
      }, 
      { status: 429 }
    );
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key missing" }, { status: 500 });
    }
    const { jobTitle, company, jobDescription, resumeId, resumeText: providedResumeText } = await request.json();
    if (!jobTitle || !company) {
      return NextResponse.json({ error: "Missing jobTitle or company" }, { status: 400 });
    }

    // Determine resume text priority: provided text > selected resume > latest resume
    let resumeText: string | null = null;

    if (typeof providedResumeText === "string" && providedResumeText.trim().length > 0) {
      resumeText = providedResumeText.trim();
    } else {
      const baseResume = resumeId
        ? await prisma.resume.findFirst({ where: { id: resumeId, userId } })
        : await prisma.resume.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
      resumeText = baseResume?.optimizedContent || baseResume?.content || null;
    }

    if (!resumeText) {
      return NextResponse.json({ error: "Provide resumeText or create a resume first" }, { status: 400 });
    }

    const jd = jobDescription ? `Here is the job description to target: \n\n${jobDescription}\n\n` : "";
    const prompt = `Write a concise, tailored cover letter (max ~350 words) for the role of ${jobTitle} at ${company}. Use the candidate's resume below. Be specific, avoid cliches, align skills with the role, and emphasize verifiable accomplishments. ${jd}RESUME:\n${resumeText}`;

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

    const data: any = { userId, jobTitle, company, content: letter };
    if (baseResume?.id) data.resumeId = baseResume.id;
    if (jobDescription) data.jobDescription = jobDescription;
    const saved = await prisma.coverLetter.create({ data });

    // Increment usage count after successful generation
    await incrementUsage(userId, 'cover');

    return NextResponse.json({ 
      id: saved.id, 
      content: letter,
      usage: {
        remaining: usageCheck.remainingCovers - 1,
        periodEnd: usageCheck.periodEnd
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Generation failed", detail: error?.message ?? "" }, { status: 500 });
  }
}


