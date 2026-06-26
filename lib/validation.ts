import { z } from "zod";

// Length caps bound the text we forward to OpenAI, so a single request can't run
// up the bill (or wedge the model) with megabytes of input. Generous enough for
// real resumes/JDs, small enough to stop abuse.
const LONG = 20_000; // full resume text
const MED = 12_000; // job / project descriptions
const SHORT = 300; // titles, names, budget
const ID = 64; // cuid-style ids

export const generateResumeSchema = z.object({
  resume: z.string().trim().min(1, "Invalid resume content").max(LONG, "Resume text is too long"),
  jobDescription: z.string().max(MED, "Job description is too long").optional(),
  title: z.string().max(SHORT).optional(),
});

// Optional string fields default to "" so downstream code (which uses truthy /
// typeof checks) sees a stable string type — same behavior as undefined.
export const generateCoverSchema = z.object({
  jobTitle: z.string().trim().min(1, "Missing jobTitle").max(SHORT, "Job title is too long"),
  company: z.string().max(SHORT).default(""),
  clientName: z.string().max(SHORT).default(""),
  jobDescription: z.string().max(MED, "Job description is too long").default(""),
  resumeId: z.string().max(ID).default(""),
  resumeText: z.string().max(LONG, "Resume text is too long").default(""),
});

export const generateProposalSchema = z.object({
  projectTitle: z.string().trim().min(1, "Missing projectTitle").max(SHORT, "Project title is too long"),
  clientName: z.string().max(SHORT).default(""),
  projectDetails: z.string().max(MED, "Project details are too long").default(""),
  budget: z.string().max(SHORT).default(""),
  resumeId: z.string().max(ID).default(""),
  resumeText: z.string().max(LONG, "Resume text is too long").default(""),
});

export type ValidationResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** safeParse wrapper that returns the first issue's message for a 400 response. */
export function validateBody<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  const issue = result.error.issues[0];
  return { ok: false, error: issue?.message || "Invalid request" };
}
