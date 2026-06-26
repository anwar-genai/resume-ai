import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { checkUsageLimit, incrementUsage } from "@/lib/usage";
import { devDetail } from "@/lib/http";
import { generateProposalSchema, validateBody } from "@/lib/validation";
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

  const usageCheck = await checkUsageLimit(userId, 'proposal');
  if (!usageCheck.canProceed) {
    return NextResponse.json(
      {
        error: usageCheck.isBlocked
          ? 'Account blocked'
          : `Weekly proposal limit reached (${usageCheck.remaining} remaining this week, ${usageCheck.remainingDaily} today)`,
        usage: usageCheck,
        limitReached: true,
      },
      { status: usageCheck.isBlocked ? 403 : 429 }
    );
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key missing" }, { status: 500 });
    }

    const parsed = validateBody(generateProposalSchema, await request.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { projectTitle, clientName, projectDetails, budget, resumeId, resumeText: providedResumeText } = parsed.data;

    // Resolve resume text: provided -> from resumeId -> latest resume
    let resumeText: string | null = null;
    if (typeof providedResumeText === 'string' && providedResumeText.trim()) {
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

    const salutation = clientName?.trim() ? `Hi ${clientName.trim()},` : `Hi there,`;
    const detailsBlock = projectDetails?.trim() ? `Project details provided:\n\n${asData("PROJECT DETAILS", projectDetails.trim())}\n\n` : '';
    const budgetLine = budget?.trim() ? `Budget/rate input: ${budget.trim()}` : '';
    const recipientLabel = clientName?.trim() || 'your organization';

    const prompt = `${salutation}\n\nWrite a concise, persuasive Upwork proposal (180–230 words) for: "${projectTitle}" at ${recipientLabel}.\nStyle: first person, friendly-professional, outcome-driven. No headings, no bold, no emojis. Avoid markdown entirely.\n\nInclude, in this order:\n1) 1–2 sentence hook tailored to the project and recipient (individual vs company tone).\n2) A 2–3 step approach with realistic sequence and short timeline.\n3) 1–2 proof points with concrete results (numbers if available) drawn from the resume.\n4) An explicit rate line using the given budget if present (e.g., "My rate: ${budget || '[set rate]'}; for this scope I’d propose …") and a short availability note.\n5) Clear CTA (15‑minute call or a tiny paid kickoff milestone).\n\nIf the title is long or has multiple variants, choose the single most relevant focus based on the resume and details. Keep sentences tight; avoid generic buzzwords.\n\n${budgetLine ? budgetLine + '\n' : ''}${detailsBlock}${asData("RESUME", resumeText)}`;

    // Stream the proposal to the client; persist + count usage on finish.
    return await streamChat({
      system: `You write concise, high-conversion Upwork proposals. ${ANTI_INJECTION_RULE}`,
      user: prompt,
      temperature: 0.4,
      onComplete: async (content) => {
        if (!content) return;
        const data: any = { userId, projectTitle, clientName: clientName || null, content };
        if (projectDetails) data.projectDetails = projectDetails;
        if (budget) data.budget = budget;
        if (resumeId) data.resumeId = resumeId;
        await prisma.proposal.create({ data });
        await incrementUsage(userId, 'proposal');
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Generation failed", ...devDetail(error) }, { status: 500 });
  }
}


