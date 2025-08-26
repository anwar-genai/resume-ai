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

  // Reuse cover letter quota for proposals
  const usageCheck = await checkUsageLimit(userId, 'cover');
  if (!usageCheck.canProceed) {
    return NextResponse.json(
      { error: "Monthly proposal limit reached", usage: usageCheck, limitReached: true },
      { status: usageCheck.isBlocked ? 403 : 429 }
    );
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key missing" }, { status: 500 });
    }

    const body = await request.json();
    const { projectTitle, clientName, projectDetails, budget, resumeId, resumeText: providedResumeText } = body as {
      projectTitle: string;
      clientName?: string;
      projectDetails?: string;
      budget?: string;
      resumeId?: string;
      resumeText?: string;
    };

    if (!projectTitle) {
      return NextResponse.json({ error: "Missing projectTitle" }, { status: 400 });
    }

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
    const detailsBlock = projectDetails?.trim() ? `Project details provided:\n\n${projectDetails.trim()}\n\n` : '';
    const budgetLine = budget?.trim() ? `Budget/rate input: ${budget.trim()}` : '';
    const recipientLabel = clientName?.trim() || 'your organization';

    const prompt = `${salutation}\n\nWrite a concise, persuasive Upwork proposal (180–230 words) for: "${projectTitle}" at ${recipientLabel}.\nStyle: first person, friendly-professional, outcome-driven. No headings, no bold, no emojis. Avoid markdown entirely.\n\nInclude, in this order:\n1) 1–2 sentence hook tailored to the project and recipient (individual vs company tone).\n2) A 2–3 step approach with realistic sequence and short timeline.\n3) 1–2 proof points with concrete results (numbers if available) drawn from the resume.\n4) An explicit rate line using the given budget if present (e.g., "My rate: ${budget || '[set rate]'}; for this scope I’d propose …") and a short availability note.\n5) Clear CTA (15‑minute call or a tiny paid kickoff milestone).\n\nIf the title is long or has multiple variants, choose the single most relevant focus based on the resume and details. Keep sentences tight; avoid generic buzzwords.\n\n${budgetLine ? budgetLine + '\n' : ''}${detailsBlock}RESUME:\n${resumeText}`;

    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You write concise, high-conversion Upwork proposals." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "No content generated" }, { status: 502 });
    }

    const data: any = { userId, projectTitle, clientName: clientName || null, content };
    if (projectDetails) data.projectDetails = projectDetails;
    if (budget) data.budget = budget;
    if (resumeId) data.resumeId = resumeId;

    const saved = await prisma.proposal.create({ data });

    await incrementUsage(userId, 'cover');
    return NextResponse.json({ id: saved.id, content, usage: { remaining: usageCheck.remainingCovers - 1, periodEnd: usageCheck.periodEnd } });
  } catch (error: any) {
    return NextResponse.json({ error: "Generation failed", detail: error?.message ?? "" }, { status: 500 });
  }
}


