import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";
import { atsScoreSchema, validateBody } from "@/lib/validation";
import { isEmailVerified } from "@/lib/verification";
import { atsLimiter, checkRateLimit } from "@/lib/ratelimit";
import { devDetail } from "@/lib/http";
import { openai, MODEL_NAME, ANTI_INJECTION_RULE, asData } from "@/lib/llm";

// Lenient parse of the model's JSON — each field falls back instead of throwing.
const atsResultSchema = z.object({
  score: z.coerce.number().min(0).max(100).catch(0),
  summary: z.string().catch(""),
  matchedKeywords: z.array(z.string()).catch([]),
  missingKeywords: z.array(z.string()).catch([]),
  suggestions: z.array(z.string()).catch([]),
});

// Strict structured-output schema — the model is forced to return exactly this.
const ATS_JSON_SCHEMA = {
  name: "ats_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      score: { type: "integer", description: "Overall match, 0-100" },
      summary: { type: "string", description: "1-2 sentence assessment of fit" },
      matchedKeywords: { type: "array", items: { type: "string" } },
      missingKeywords: { type: "array", items: { type: "string" } },
      suggestions: { type: "array", items: { type: "string" } },
    },
    required: ["score", "summary", "matchedKeywords", "missingKeywords", "suggestions"],
  },
} as const;

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

    const prompt = `Compare the resume to the job description as an ATS/recruiter would.
- score: overall match 0-100.
- matchedKeywords: important skills/keywords from the job that ARE in the resume.
- missingKeywords: important skills/keywords from the job that are MISSING from the resume.
- suggestions: 3-6 specific, actionable improvements; suggest only changes the candidate's real experience can support — never invent experience.
Up to 12 items per keyword array; keep keywords concise (skills, tools, titles).

${asData("JOB DESCRIPTION", jobDescription)}

${asData("RESUME", resumeText)}`;

    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content: `You are an ATS and technical recruiting expert. ${ANTI_INJECTION_RULE}`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: "json_schema", json_schema: ATS_JSON_SCHEMA },
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
