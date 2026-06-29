# Project-Gap Builder — spec (v0)

Status: **proposed** (not scheduled). Gated behind deploy + Product P1 (export quality).
See the "Future bets" section in [CLAUDE.md](../CLAUDE.md).

## One-liner
When a user's experience doesn't match a job description, don't help them *fake* a
project — help them **build a real, relevant one fast**: analyze the gap, propose a
concrete project, and emit a ready-to-paste **build prompt for Claude Code / Codex /
Cursor** so they can start coding immediately.

## Why this (and not the obvious thing)
The competitor set (Rezi, Kickresume, Teal, Jobscan, ApplyArc, Upwex…) all do
*generation*. None help the user close an actual skills/portfolio gap. This is the
novel hook, it's cheap (pure LLM on existing infra — no new services), and it deepens
the core value: a better-matched candidate → a better resume → a better outcome.

## Ethical guardrail (load-bearing — do not skip)
- The feature **builds real projects**, it never invents experience.
- Copy must say "build it for real, fast" — never "add this to your resume now."
- The resume/ATS features should only ingest a project **after** the user marks it built.
- Rationale: the moment we help list fabricated work, it's resume fraud and a
  reputational landmine. This framing is a product requirement, not a nicety.

## User flow
1. User pastes a **JD** and (optionally) selects an existing resume / lists current skills.
2. **Gap analysis**: which JD requirements the user already covers vs. is missing.
3. For the top 1–3 gaps, propose a **scoped portfolio project** that demonstrates them:
   - title + one-line pitch
   - skills/keywords it will evidence (mapped back to the JD)
   - suggested tech stack
   - milestone breakdown + realistic time estimate (e.g. "weekend build")
   - "definition of done" / what to show (repo, demo, README bullet for the resume)
4. **Emit a copy-paste build prompt** for Claude Code / Codex / Cursor that scaffolds it.
5. (Later) "Mark as built" → feed the project into the resume optimizer as real material.

## API
New route `app/api/project-gap/route.ts`, mirroring the existing generation routes:
- Pre-checks: `getAuthSession()`, email-verified gate (`lib/verification.ts`), usage
  (`checkUsageLimit` — see "Billing" below), zod validation (`lib/validation.ts`,
  cap JD/skills length).
- Defense: reuse `ANTI_INJECTION_RULE` + `asData("job_description", jd)` from `lib/llm.ts`
  (the JD is untrusted input).
- **Two-step, not one:**
  1. **Gap analysis + project plan** → strict `json_schema` structured output (like
     `ats-score`), so the UI can render sections reliably. *Not* streamed.
  2. **Build prompt** → `streamChat()` (it's long prose; stream it token-by-token using
     the existing `lib/streamClient.ts` `streamPost` on the client).
- Save + `incrementUsage` in `onComplete`, consistent with the other routes.

### Structured output (step 1) — shape
```jsonc
{
  "coverage": [{ "requirement": "…", "status": "have" | "partial" | "missing" }],
  "projects": [{
    "title": "…",
    "pitch": "…",
    "evidences": ["JD keyword/skill", "…"],
    "stack": ["…"],
    "milestones": [{ "step": "…", "estimate": "…" }],
    "definitionOfDone": "…",
    "resumeBullet": "…"            // honest, only valid once actually built
  }]
}
```

### Build-prompt output (step 2) — what the streamed text should contain
A single prompt the user pastes into Claude Code/Cursor, including: goal, chosen stack,
file/folder structure, step-by-step build order, acceptance criteria, and a final
"explain key decisions in the README" instruction (so they can speak to it in interviews).

## Data model (optional, for persistence / "mark as built")
```prisma
model PortfolioProject {
  id        String   @id @default(cuid())
  userId    String
  jd        String?  // source JD (truncated)
  plan      Json     // step-1 structured output
  buildPrompt String
  built     Boolean  @default(false)
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}
```
MVP can skip persistence and just return results; add the model when wiring "mark as
built" → resume optimizer.

## Billing / usage
Give it its **own quota bucket** (don't cannibalize resume/cover/proposal allowances).
Extend `lib/plans.ts` + `lib/usage.ts` with a `'project'` document type, or meter it
with a separate Upstash limiter like `ats-score` does. Decide before building.

## UI
- New entry point (e.g. `/project-gap`, plus a card on the dashboard "Build from scratch"
  area) — reuse `GlassCard`, `Button`, the streaming render pattern from the generate pages.
- Show coverage as a checklist (have/partial/missing), projects as cards, and the build
  prompt in a copy-to-clipboard block with a "Open in Cursor/Claude Code" hint.

## MVP cut (smallest shippable)
1. `/project-gap` page: paste JD + skills.
2. One API call → structured gap + **one** project + **one** build prompt (stream it).
3. Copy-to-clipboard on the prompt. No persistence, no "mark as built".
Everything else (multiple projects, persistence, resume hand-off, dashboard card) is v1+.

## Open questions
- Separate quota vs. shared? (recommend separate.)
- Persist projects, or stateless MVP? (recommend stateless first.)
- How opinionated on stack — let the user constrain it (language/framework) up front.
