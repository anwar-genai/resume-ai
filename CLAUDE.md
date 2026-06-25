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
- `lib/usage.ts` — `checkUsageLimit(userId, 'resume'|'cover')` / `incrementUsage(...)`.
  Enforces **both** monthly and daily caps. Proposals reuse the `'cover'` quota.
- `lib/plans.ts` — plan limits. Free: 10/mo each. Pro: 70/mo each + 10/day safety cap.
  Monthly limits are stored per-user (so admins can override); daily caps come from here.
- Generation routes (`app/api/generate-{resume,cover,proposal}`) check usage, call OpenAI,
  save via Prisma, then `incrementUsage`.

## Polar subscription billing

Flow: user clicks Upgrade → `GET /api/checkout` creates a Polar checkout (sets
`externalCustomerId = userId` + `metadata.userId`) → Polar hosted checkout → webhook
updates the user → UI reflects Pro.

- `lib/polar.ts` — Polar client. `POLAR_SERVER` = `sandbox` | `production`.
- `app/api/checkout/route.ts` — creates checkout, redirects.
- `app/api/portal/route.ts` — Polar customer portal (manage/cancel).
- `app/api/webhooks/polar/route.ts` — Standard-Webhooks signature verified via
  `validateEvent`. Handlers:
  - **`order.paid` → upgrade to Pro + reset allowance (PRIMARY trigger).**
    `subscription.active` was unreliable in testing; `order.paid` always arrives and
    carries the customer mapping, so it is the source of truth for upgrades/renewals.
  - `subscription.canceled` → keep Pro until period end, record `subscriptionEndsAt`.
  - `subscription.revoked` → downgrade to Free.

Env vars: `POLAR_SERVER`, `POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_ID`, `POLAR_WEBHOOK_SECRET`.

### Gotchas
- Token, product, and webhook must all come from the **same Polar environment/org**, and
  match `POLAR_SERVER`. A production token against the sandbox API (or vice versa) → 401.
- Local webhook testing needs a public tunnel: `ngrok http 3000`, then set
  `<tunnel>/api/webhooks/polar` as the webhook URL (Format: **Raw**). ngrok's free URL
  changes on restart — update the webhook URL when it does.
- The app reads `.env.local` only at boot — restart `npm run dev` after changing it.
- Test payments use card `4242 4242 4242 4242` (sandbox only; no real money).

## User model — billing/usage fields

`plan` ("free"|"pro"), `polarCustomerId`, `polarSubscriptionId`, `subscriptionStatus`,
`subscriptionEndsAt`, `monthlyResume/CoverLimit`, `resume/coverCount`, `currentPeriodStart`,
`dailyResume/CoverCount`, `currentDayStart`, `isBlocked`, `blockReason`.

## Status & roadmap

**Done:** Subscription upgrade + cancel/downgrade + customer portal, verified in Polar sandbox.

**Next:**
- Phase 2 — conversion: turn the 429 "limit reached" responses into a friendly in-app
  upgrade prompt; add a pricing/landing section.
- Phase 3 — launch: fix pre-existing build-blocking TS errors (`app/api/upload-resume`,
  `app/components/Particles.tsx`, `app/api/preview`); deploy (Vercel + managed Postgres
  e.g. Neon/Supabase); complete Polar production KYC + payout (Payoneer/Wise — operator is
  in Pakistan, so no Stripe); switch `POLAR_SERVER=production` with prod token/webhook.

## Constraints
- Operator is in **Pakistan** → Stripe unavailable. Billing/payouts go through **Polar**
  (Merchant of Record; supports Pakistan payouts via Stripe Connect Express). Do not
  suggest Stripe.
