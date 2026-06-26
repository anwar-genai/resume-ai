import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";
import OpenAI from "openai";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { devDetail } from "@/lib/http";
import { generateResumeSchema, validateBody } from "@/lib/validation";
import { isEmailVerified } from "@/lib/verification";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL_NAME = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session as any).userId as string;

  if (!(await isEmailVerified(userId))) {
    return NextResponse.json(
      { error: "Please verify your email to generate documents.", needsVerification: true },
      { status: 403 }
    );
  }

  // Check usage limits before processing
  const usageCheck = await checkUsageLimit(userId, 'resume');
  
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
        error: `Weekly resume limit reached (${usageCheck.remaining} remaining this week, ${usageCheck.remainingDaily} today)`,
        usage: {
          remaining: usageCheck.remaining,
          remainingDaily: usageCheck.remainingDaily,
          periodEnd: usageCheck.periodEnd,
          plan: usageCheck.plan,
          type: 'resume'
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
    const parsed = validateBody(generateResumeSchema, await request.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { resume, jobDescription, title } = parsed.data;

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

    const saved = await prisma.resume.create({
      data: { userId, title: title?.slice(0, 120) ?? null, content: resume, optimizedContent: optimized },
    });

    // Increment usage count after successful generation
    await incrementUsage(userId, 'resume');

    return NextResponse.json({ 
      id: saved.id, 
      optimized: optimized,
      usage: {
        remaining: usageCheck.remaining - 1,
        periodEnd: usageCheck.periodEnd
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Generation failed", ...devDetail(error) }, { status: 500 });
  }
}


