import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import OpenAI from "openai";
import { z } from "zod";
import { atsScoreSchema, validateBody } from "@/lib/validation";
import { isEmailVerified } from "@/lib/verification";
import { atsLimiter, checkRateLimit } from "@/lib/ratelimit";
import { devDetail } from "@/lib/http";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL_NAME = process.env.OPENAI_MODEL || "gpt-4o-mini";

// Lenient parse of the model's JSON — each field falls back instead of throwing.
const atsResultSchema = z.object({
  score: z.coerce.number().min(0).max(100).catch(0),
  summary: z.string().catch(""),
  matchedKeywords: z.array(z.string()).catch([]),
  missingKeywords: z.array(z.string()).catch([]),
  suggestions: z.array(z.string()).catch([]),
});

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email || !(session as any).userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session as any).userId as string;

  if (!(await isEmailVerified(userId))) {
    return NextResponse.json(
      { error: "Please verify your email to run an analysis.", needsVerification: true },
      { status: 403 }
    );
  }

  const rl = await checkRateLimit(atsLimiter, `ats:${userId}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Daily analysis limit reached. Please try again tomorrow." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const parsed = validateBody(atsScoreSchema, await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { resumeText, jobDescription } = parsed.data;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key missing" }, { status: 500 });
    }

    const prompt = `Compare the RESUME to the JOB DESCRIPTION as an ATS/recruiter would and return STRICT JSON with this exact shape:
{
  "score": <integer 0-100, overall match>,
  "summary": "<1-2 sentence assessment of fit>",
  "matchedKeywords": ["<important skills/keywords from the job that ARE in the resume>"],
  "missingKeywords": ["<important skills/keywords from the job that are MISSING from the resume>"],
  "suggestions": ["<3-6 specific, actionable improvements; suggest only changes the candidate's real experience can support — never invent experience>"]
}
Rules: up to 12 items per keyword array. Keywords should be concise (skills, tools, titles). Do not include any text outside the JSON.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}`;

    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: "system", content: "You are an ATS and technical recruiting expert. You return only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json({ error: "No analysis generated" }, { status: 502 });
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Analysis returned malformed data" }, { status: 502 });
    }

    const result = atsResultSchema.parse(json);
    // Trim arrays defensively in case the model overshoots.
    return NextResponse.json({
      score: Math.round(result.score),
      summary: result.summary,
      matchedKeywords: result.matchedKeywords.slice(0, 12),
      missingKeywords: result.missingKeywords.slice(0, 12),
      suggestions: result.suggestions.slice(0, 6),
    });
  } catch (error) {
    return NextResponse.json({ error: "Analysis failed", ...devDetail(error) }, { status: 500 });
  }
}
