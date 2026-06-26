# CLAUDE.md

Project context for Claude Code (and humans). Keep this current as the app evolves.

## What this is

**resume-ai** — an AI career-document SaaS: optimizes resumes, generates cover letters,
and writes Upwork proposals. Monetized via a **Polar.sh** monthly Pro subscription.

Stack: Next.js 15 (App Router, Turbopack), React 19, TypeScript, TailwindCSS v4,
Prisma + PostgreSQL, NextAuth (Credentials, JWT), OpenAI (`gpt-4o-mini`), Resend (email),
Polar (billing).

## Commands

```bash
npm run dev                 # start dev server (localhost:3000)
npm run build               # production build
npx prisma migrate deploy   # apply migrations
npx prisma generate         # regenerate client after schema changes
npx prisma studio           # browse the DB
```

To author a new migration, edit `prisma/schema.prisma`, then (Prisma's `migrate dev`
is interactive and fails in non-interactive shells) generate SQL with
`prisma migrate diff --from-url <DB_URL> --to-schema-datamodel prisma/schema.prisma --script`,
drop it into `prisma/migrations/<timestamp>_<name>/migration.sql`, and run `migrate deploy`.

## Environment

`DATABASE_URL` must exist in **both** `.env` (read by the Prisma CLI) and `.env.local`
(read by the Next.js app). All other vars live in `.env.local`. Both are gitignored.

Required: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, `NEXTAUTH_SECRET`,
`OPENAI_API_KEY`, `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_EMAILS`, and Polar vars below.

## Architecture

- `lib/auth.ts` — NextAuth config; session exposes `userId`. Use `getAuthSession()`.
- `lib/db.ts` — Prisma singleton (`prisma`).
- `lib/usage.ts` — `checkUsageLimit(userId, 'resume'|'cover'|'proposal')` / `incrementUsage(...)`.
  Enforces **both** a weekly allowance and a daily safety cap. Each document type
  (resume / cover / proposal) has its own independent quota.
- `lib/plans.ts` — single source of truth for tiers & limits (plan-driven, read by
  `user.plan`; not stored per-user). Free: 3/week each. Pro ($5): 25/week each + 10/day.
  Power ($12): 100/week each + 25/day. `PERIOD_DAYS = 7`.
- Generation routes (`app/api/generate-{resume,cover,proposal}`) check usage, call OpenAI,
  save via Prisma, then `incrementUsage`.
- `app/pricing/page.tsx` — public 3-tier pricing page; paid CTAs hit `/api/checkout?plan=`.

## Polar subscription billing

Flow: user picks a plan on `/pricing` → `GET /api/checkout?plan=pro|power` creates a Polar
checkout (sets `externalCustomerId = userId` + `metadata.{userId,plan}`) → Polar hosted
checkout → webhook updates the user → UI reflects the plan.

- `lib/polar.ts` — Polar client + plan↔product mapping. `POLAR_SERVER` = `sandbox` |
  `production`. `productIdForPlan()` / `planForProductId()` map our plan ids to the
  per-plan Polar product ids; `productIdFromEvent()` reads the product id off a webhook.
- `app/api/checkout/route.ts` — creates checkout for `?plan=` (defaults to pro), redirects.
- `app/api/portal/route.ts` — Polar customer portal (manage/cancel/switch plan).
- `app/api/webhooks/polar/route.ts` — Standard-Webhooks signature verified via
  `validateEvent`. The plan granted is derived from the purchased **product id** (not
  hardcoded). Handlers:
  - **`order.paid` → upgrade to the plan + reset allowance (PRIMARY trigger).**
    `subscription.active` was unreliable in testing; `order.paid` always arrives and
    carries the customer mapping, so it is the source of truth for upgrades/renewals.
  - `subscription.canceled` (and `subscription.updated` with `cancelAtPeriodEnd`) → keep
    plan until period end, record `subscriptionEndsAt` (drives the "ends on X" banner).
  - `subscription.revoked` → downgrade to Free.

Env vars: `POLAR_SERVER`, `POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_ID_PRO`,
`POLAR_PRODUCT_ID_POWER` (legacy `POLAR_PRODUCT_ID` still honoured as Pro),
`POLAR_WEBHOOK_SECRET`.

### Gotchas
- Token, product, and webhook must all come from the **same Polar environment/org**, and
  match `POLAR_SERVER`. A production token against the sandbox API (or vice versa) → 401.
- Local webhook testing needs a public tunnel: `ngrok http 3000`, then set
  `<tunnel>/api/webhooks/polar` as the webhook URL (Format: **Raw**). ngrok's free URL
  changes on restart — update the webhook URL when it does.
- The app reads `.env.local` only at boot — restart `npm run dev` after changing it.
- Test payments use card `4242 4242 4242 4242` (sandbox only; no real money).

## User model — billing/usage fields

`plan` ("free"|"pro"|"power"), `polarCustomerId`, `polarSubscriptionId`,
`subscriptionStatus`, `subscriptionEndsAt`, `resume/cover/proposalCount` (weekly),
`currentPeriodStart`, `dailyResume/Cover/ProposalCount`, `currentDayStart`, `isBlocked`,
`blockReason`. Limits are no longer stored per-user — they come from `lib/plans.ts`.

## Status & roadmap

**Current baseline (`main`):** Three plans (Free / Pro $5 / Power $12), weekly allowances
per document type, proposals split into their own quota, a `/pricing` page, and
`?plan=`-aware checkout. Recurring subscription lifecycle verified in sandbox. Security
work done: rate limiting (Upstash) on login/register/forgot, host-header fix on reset
links, email-enumeration timing fix, security headers + CSP, SSRF removed (job-link fetch
gone — cover/proposal use pasted text), and polished register/login UX (auto sign-in).

### Security & privacy phases
- **Phase 1 — auth hardening (DONE):** 8-char password minimum + HaveIBeenPwned breach
  check (`lib/password.ts`), reset tokens hashed at rest (`lib/tokens.ts`), error details
  stripped from prod responses (`lib/http.ts` `devDetail`), upload size cap + PDF
  magic-byte check.
- **Phase 2 — input validation (DONE):** zod schemas + length caps on the generation
  routes (`lib/validation.ts`); bounds the text forwarded to OpenAI. `zod` is now a
  direct dependency.
- **Phase 3 — privacy/data rights:** account deletion (cascade + Polar revoke), data
  export (JSON), privacy policy page disclosing processors.
- **Phase 4 — email verification gating:** require a verified email before generation;
  reuse the existing verify-email / send-verification flow.
- **Phase 5 — Google OAuth:** add the provider + account linking.

### Product/launch phases
- Conversion: turn the 429 "limit reached" responses into a friendly in-app upgrade prompt
  linking to `/pricing`.
- Launch: fix pre-existing build-blocking TS errors (`app/api/upload-resume`,
  `app/components/Particles.tsx`, `app/api/preview`); deploy (Vercel + managed Postgres
  e.g. Neon/Supabase); complete Polar production KYC + payout (Payoneer/Wise — operator is
  in Pakistan, so no Stripe); switch `POLAR_SERVER=production` with prod token/webhook.

## Constraints
- Operator is in **Pakistan** → Stripe unavailable. Billing/payouts go through **Polar**
  (Merchant of Record; supports Pakistan payouts via Stripe Connect Express). Do not
  suggest Stripe.
