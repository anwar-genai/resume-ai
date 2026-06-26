import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { devDetail } from "@/lib/http";
import { generateCoverSchema, validateBody } from "@/lib/validation";
import { isEmailVerified } from "@/lib/verification";
import { streamChat, ANTI_INJECTION_RULE, asData } from "@/lib/llm";

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
        error: `Weekly cover letter limit reached (${usageCheck.remaining} remaining this week, ${usageCheck.remainingDaily} today)`,
        usage: {
          remaining: usageCheck.remaining,
          remainingDaily: usageCheck.remainingDaily,
          periodEnd: usageCheck.periodEnd,
          plan: usageCheck.plan,
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
    const parsed = validateBody(generateCoverSchema, await request.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { jobTitle, company, clientName, jobDescription, resumeId, resumeText: providedResumeText } = parsed.data;

    // Determine resume text priority: provided text > selected resume > latest resume
    let resumeText: string | null = null;
    let resumeIdToAttach: string | undefined = undefined;

    if (typeof providedResumeText === "string" && providedResumeText.trim().length > 0) {
      resumeText = providedResumeText.trim();
    } else {
      const baseResume = resumeId
        ? await prisma.resume.findFirst({ where: { id: resumeId, userId } })
        : await prisma.resume.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
      resumeText = baseResume?.optimizedContent || baseResume?.content || null;
      if (baseResume?.id) {
        resumeIdToAttach = baseResume.id;
      }
    }

    if (!resumeText) {
      return NextResponse.json({ error: "Provide resumeText or create a resume first" }, { status: 400 });
    }

    // Build salutation and company label
    const hasClient = typeof clientName === 'string' && clientName.trim().length > 0;
    const hasCompany = typeof company === 'string' && company.trim().length > 0;
    const companyLabel = hasCompany ? company.trim() : (hasClient ? clientName.trim() : "your organization");
    // Ensure we always persist a non-empty company value to satisfy Prisma schema
    const companyToPersist = hasCompany ? company.trim() : (hasClient ? clientName.trim() : "Unknown");
    const salutation = hasClient
      ? `Dear ${clientName.trim()},`
      : (hasCompany ? `Dear Hiring Manager at ${company.trim()},` : `Dear Hiring Manager,`);

    const jd = jobDescription ? `Here is the job description to target:\n\n${asData("JOB DESCRIPTION", jobDescription)}\n\n` : "";
    const prompt = `${salutation}\n\nWrite a concise, tailored cover letter (max ~350 words) for the role of ${jobTitle} at ${companyLabel}. Use the candidate's resume below.\n- Use a tone appropriate to the recipient (more conversational for an individual client; more formal for a company).\n- If the job title is long or contains multiple variants, select the most relevant focus based on the resume and the description.\n- Emphasize concrete, verifiable achievements; avoid cliches.\n- If the company is unknown or an individual client, avoid corporate jargon (e.g., use \"your project\" / \"your team\").\n- End with a clear next step (quick call, proposed timeline, or deliverable).\n\n${jd}${asData("RESUME", resumeText)}`;

    // Stream the cover letter to the client; persist + count usage on finish.
    return await streamChat({
      system: `You are a professional cover letter writer. ${ANTI_INJECTION_RULE}`,
      user: prompt,
      temperature: 0.5,
      onComplete: async (letter) => {
        if (!letter) return;
        const data: any = { userId, jobTitle, company: companyToPersist, content: letter };
        if (resumeIdToAttach) data.resumeId = resumeIdToAttach;
        if (jobDescription) data.jobDescription = jobDescription;
        await prisma.coverLetter.create({ data });
        await incrementUsage(userId, 'cover');
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Generation failed", ...devDetail(error) }, { status: 500 });
  }
}


