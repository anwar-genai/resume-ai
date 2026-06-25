## resume-ai

AI-powered career-document platform that optimizes resumes, generates tailored cover letters, and writes Upwork proposals. Built with Next.js 15 (App Router), TypeScript, TailwindCSS, Prisma (PostgreSQL), NextAuth, OpenAI, and Resend.

### Demo
Below are feature demos placed alongside their respective routes/flows.

**Home view (/)**
![App Overview](public/screenshots/overview.png)

**Dashboard (/dashboard)**
![Dashboard](public/screenshots/dashboard.png)

**Resume Optimizer (/resume)**
![Resume Optimizer](public/screenshots/ResumeOptimizer.png)

**Cover Letter (/cover-letter)**
![Cover Letter](public/screenshots/CoverLetter.png)

**Proposal (/upwork-proposal)**
![Proposal](public/screenshots/Proposal.png)

### Features

- **Authentication**: Email/password via NextAuth (Credentials + Prisma adapter, bcrypt hashing)
- **Email verification & password reset**: Token-based flows delivered via Resend (verify email, forgot/reset password)
- **Resume optimization**: ATS-focused improvements using OpenAI
- **Cover letter generation**: Tailored to job title, company, and (optionally) a job description
- **Upwork proposal generation**: Tailored to project title, client, budget, and project details
- **PDF upload & parsing**: Upload an existing resume (PDF) and extract its text via `pdf-parse` / `pdfjs-dist`
- **PDF & text export**: Download any generated document as PDF (`jspdf` + `html2canvas`) or plain text
- **Usage control**: Per-user monthly limits, usage counters, and account blocking
- **Admin tools**: User-management API for viewing/adjusting limits and blocking abusive accounts
- **Storage**: Resumes, cover letters, and proposals saved in PostgreSQL via Prisma
- **Dashboard**: View, preview, and download previous outputs
- **Polished UI**: TailwindCSS with glassmorphism components, animated background, theme toggle, and page transitions

### Tech Stack

- **Frontend**: Next.js 15 (App Router, Turbopack), React 19, TypeScript, TailwindCSS v4
- **Auth**: NextAuth (Credentials provider, Prisma adapter, JWT sessions)
- **Database**: PostgreSQL + Prisma ORM
- **AI**: OpenAI Chat Completions API (default model: `gpt-4o-mini`)
- **Email**: Resend
- **PDF**: `pdf-parse`, `pdfjs-dist` (parsing), `jspdf`, `html2canvas` (export)

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Resend API key (for verification / password-reset emails)

### Quick Start

1) Copy environment variables template

```bash
# macOS/Linux
cp app/env.example .env.local

# Windows (PowerShell)
Copy-Item app/env.example .env.local
```

2) Fill required env vars (see [Environment Variables](#environment-variables) below). Note: `DATABASE_URL` must also be present in a root `.env` file so the Prisma CLI can read it during migrations.

3) Install dependencies and apply migrations

```bash
npm i
npx prisma migrate deploy   # applies existing migrations
npx prisma generate
```

> Use `migrate deploy` against an existing migration history. Use `npx prisma migrate dev` only when authoring new schema changes.

4) Start the dev server

```bash
npm run dev
```

### Main Routes

- `/` — Landing page
- `/register`, `/login` — Authentication (email/password)
- `/auth/verify-email` — Email verification
- `/auth/forgot-password`, `/auth/reset-password` — Password reset
- `/dashboard` — Saved resumes, cover letters, and proposals
- `/resume` — Paste or upload, then optimize resume text
- `/cover-letter` — Generate tailored cover letters
- `/upwork-proposal` — Generate tailored Upwork proposals

### API Endpoints

**Auth**
- `POST /api/register` — Register user
- `POST /api/auth/send-verification` — Send verification email
- `GET  /api/auth/verify-email` — Verify email via token
- `POST /api/auth/forgot-password` — Request password-reset email
- `POST /api/auth/reset-password` — Reset password via token

**Generation**
- `POST /api/generate-resume` — Optimize resume using OpenAI
- `POST /api/generate-cover` — Generate cover letter using OpenAI
- `POST /api/generate-proposal` — Generate Upwork proposal using OpenAI
- `POST /api/upload-resume` — Upload a PDF and extract resume text

**Documents & export**
- `GET /api/resumes` — List the current user's resumes
- `GET /api/user/documents` — List the current user's documents
- `GET /api/user/usage` — Current usage and limits
- `GET /api/preview/:type/:id` — Preview a document (resume | cover | proposal)
- `GET /api/export/resume/:id` — Download resume
- `GET /api/export/cover/:id` — Download cover letter
- `GET /api/export/proposal/:id` — Download proposal

**Admin**
- `GET|POST /api/admin/user-management` — View/adjust user limits, block accounts (admin only)

### Environment Variables

```
# Database
DATABASE_URL           # PostgreSQL connection string (URL-encode special chars in password)

# App URLs
NEXT_PUBLIC_APP_URL    # e.g. http://localhost:3000
NEXTAUTH_URL           # e.g. http://localhost:3000
NEXTAUTH_SECRET        # 32-byte base64 string

# OpenAI
OPENAI_API_KEY         # Your OpenAI key
OPENAI_MODEL           # Optional (defaults to gpt-4o-mini)

# Email (Resend)
RESEND_API_KEY         # Resend API key
FROM_EMAIL             # e.g. Acme <onboarding@resend.dev>

# Admin
ADMIN_EMAILS           # Comma-separated list of admin emails

# Usage control (optional — defaults provided)
# DEFAULT_RESUME_LIMIT=10
# DEFAULT_COVER_LIMIT=10
```

Tip: Generate a secret on any platform

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Development Notes

- Prisma client is auto-generated on install via the `postinstall` script.
- Credentials sign-in uses the JWT session strategy.
- Secure API routes rely on `getServerSession`.
- Usage limits and account blocking are enforced in `lib/usage.ts` and `lib/middleware.ts`.
- Email delivery and token generation live in `lib/email.ts` and `lib/tokens.ts`.

### Project Structure

```
app/
  api/
    admin/user-management/route.ts
    auth/[...nextauth]/route.ts
    auth/{send-verification,verify-email,forgot-password,reset-password}/route.ts
    generate-resume/route.ts
    generate-cover/route.ts
    generate-proposal/route.ts
    upload-resume/route.ts
    resumes/route.ts
    user/{documents,usage}/route.ts
    preview/[type]/[id]/route.ts
    export/{resume,cover,proposal}/[id]/route.ts
    register/route.ts
  auth/{verify-email,forgot-password,reset-password}/page.tsx
  dashboard/page.tsx
  resume/page.tsx
  cover-letter/page.tsx
  upwork-proposal/page.tsx
  components/            # Navbar, UsageDisplay, DocumentPreview, UI primitives, etc.
lib/
  auth.ts  db.ts  email.ts  middleware.ts  pdf-generator.ts  tokens.ts  usage.ts
prisma/
  schema.prisma
  migrations/
```

### Data Model (Prisma)

- **User** — credentials, email verification, usage counters/limits, blocking flags
- **Account / Session / VerificationToken** — NextAuth models
- **Resume** — original + optimized content
- **CoverLetter** — job title, company, optional job description
- **Proposal** — project title, client, budget, project details

### License

MIT
