# Deployment runbook

Deploy target: **Vercel** (Next.js) + **Neon** (managed Postgres). Email: **Resend**
(sending) + **Zoho Mail** (receiving). Billing: **Polar**. Rate limiting: **Upstash**.

Deploy in this order so the riskiest, hardest-to-test pieces are validated first. You
can run the whole thing on the free `*.vercel.app` URL before attaching a domain.

Domain: use **numlian.com** for this product (keep `ustbian.com` for the separate uni
app). App at `numlian.com` or `resume.numlian.com`; sending on `send.numlian.com`;
receiving (support@) on `numlian.com`.

---

## Stage 1 — Database (Neon)

1. Create a Neon project (region close to your Vercel region).
2. Copy **two** connection strings from the dashboard:
   - **Pooled** — host contains `-pooler`. Use for runtime → `DATABASE_URL`.
   - **Direct** — no `-pooler`. Use for migrations only.
3. Append `?sslmode=require` if not already present.

> Why two: serverless functions open many short-lived connections; the pooled URL
> (PgBouncer) prevents exhausting Postgres. Migrations need a direct connection.

## Stage 2 — Vercel (deploy to *.vercel.app first)

1. Import the GitHub repo. Framework auto-detects as Next.js.
2. Add every env var from the table below (Project → Settings → Environment Variables).
   Start with `POLAR_SERVER=sandbox` and `REQUIRE_EMAIL_VERIFICATION=false`.
3. Deploy. Note the `your-app.vercel.app` URL and set `NEXTAUTH_URL` /
   `NEXT_PUBLIC_APP_URL` to it (redeploy after).
4. Apply migrations against the prod DB from your machine, using the **direct** URL:

   ```bash
   # PowerShell
   $env:DATABASE_URL="<neon-direct-url>"; npx prisma migrate deploy
   # bash
   DATABASE_URL="<neon-direct-url>" npx prisma migrate deploy
   ```

> Build note: the build script is `next build --turbopack`. If a production Turbopack
> build fails on Vercel, change it to `next build` (webpack) — same output, more battle-tested.

## Stage 3 — Validate on the .vercel.app URL

Still on Polar **sandbox**, verification off. Smoke-test end to end:
- register → login → generate resume / cover / proposal
- weekly + daily limits enforced (429 with friendly message)
- upgrade (sandbox card `4242 4242 4242 4242`) → webhook flips plan to Pro/Power
- customer portal (manage/cancel) → cancel banner shows
- export data, then delete a throwaway account

## Stage 4 — Domain + email

1. **Vercel**: add domain `resume.numlian.com` (or root `numlian.com`) → add the CNAME/A
   records it shows at your DNS host.
2. **Resend**: add domain `send.numlian.com` → add its SPF + DKIM (+ DMARC) records →
   verify. Then set `FROM_EMAIL="resume-ai <noreply@send.numlian.com>"`.
3. **Zoho Mail** (receiving): add `numlian.com` → add the **MX** records + verification
   TXT → create `support@numlian.com`. Use it as the Reply-To / privacy-page contact.
4. Update env to the real domain and flip the email gate on:
   - `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` = `https://resume.numlian.com`
   - remove `REQUIRE_EMAIL_VERIFICATION` (defaults on)
   - Re-test real verification + password-reset emails.

> DNS: Resend records live on the `send.` subdomain; Zoho MX live on the root. They don't
> conflict. Keep one SPF record per host.

## Stage 5 — Polar production

1. Complete Polar KYC + payout (Payoneer/Wise — Stripe isn't available in Pakistan).
2. Create **production** Pro and Power recurring products.
3. Set: `POLAR_SERVER=production`, prod `POLAR_ACCESS_TOKEN`, prod
   `POLAR_PRODUCT_ID_PRO` / `POLAR_PRODUCT_ID_POWER`.
4. Create a **production webhook** → `https://resume.numlian.com/api/webhooks/polar`
   (Format: **Raw**) → copy its secret to `POLAR_WEBHOOK_SECRET`.
5. Do one real paid upgrade to confirm the live webhook flips the plan.

## Stage 6 — Post-launch checks

- Response headers present in prod (DevTools → Network): CSP, HSTS, X-Frame-Options.
- Rate limiting keys off the real client IP behind Vercel's proxy (`x-forwarded-for`).
- No CSP "Refused to…" errors in the Console while clicking through the app.

---

## Environment variables (Vercel Project Settings)

| Var | Source / value | Differs in prod |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** URL (`?sslmode=require`) | — |
| `NEXTAUTH_URL` | full app URL | `.vercel.app` → custom domain |
| `NEXT_PUBLIC_APP_URL` | full app URL | same |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | — |
| `OPENAI_API_KEY` | OpenAI | — |
| `OPENAI_MODEL` | optional (default `gpt-4o-mini`) | — |
| `RESEND_API_KEY` | Resend | — |
| `FROM_EMAIL` | `resume-ai <noreply@send.numlian.com>` | sandbox → real domain |
| `ADMIN_EMAILS` | comma-separated admin emails | — |
| `REQUIRE_EMAIL_VERIFICATION` | `false` for staging; unset (on) for prod | yes |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL | — |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token | — |
| `POLAR_SERVER` | `sandbox` → `production` | yes |
| `POLAR_ACCESS_TOKEN` | Polar org token | sandbox → prod |
| `POLAR_PRODUCT_ID_PRO` | Polar Pro product id | sandbox → prod |
| `POLAR_PRODUCT_ID_POWER` | Polar Power product id | sandbox → prod |
| `POLAR_WEBHOOK_SECRET` | Polar webhook secret | sandbox → prod |

`DATABASE_URL` must also exist locally in `.env` (Prisma CLI) and `.env.local` (app).
Use the Neon **direct** URL only when running `prisma migrate deploy`.

Phase 5 (Google OAuth) will add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, with the
authorized redirect URI `https://resume.numlian.com/api/auth/callback/google`.

## Gotchas specific to this app

- **`NEXTAUTH_URL` must exactly match** the live origin, or auth callbacks break.
- On Vercel there are **no `.env` files** — all vars go in Project Settings.
- **Update the Polar webhook URL** to the prod domain or upgrades won't register (the
  primary trigger is `order.paid`).
- Token, product, and webhook must all be from the **same Polar environment** as
  `POLAR_SERVER`, or you get 401s.
