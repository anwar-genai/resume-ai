## resume-ai

AI-powered Resume & Cover Letter Generator built with Next.js 14 (App Router), TypeScript, TailwindCSS, Prisma (PostgreSQL), NextAuth, and OpenAI.

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

- **Authentication**: Email/password via NextAuth (Credentials + Prisma adapter)
- **Resume optimization**: ATS-focused improvements using OpenAI
- **Cover letter generation**: Tailored to job title and company
- **Storage**: Resumes and letters saved in PostgreSQL via Prisma
- **Dashboard**: View and download previous outputs (plain text)
- **Clean UI**: TailwindCSS with minimal, professional styling

### Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Auth**: NextAuth (Credentials provider, Prisma adapter)
- **Database**: PostgreSQL + Prisma ORM
- **AI**: OpenAI Chat Completions API (default model: `gpt-4o-mini`)

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Quick Start

1) Copy environment variables template

```bash
# macOS/Linux
cp app/env.example .env.local

# Windows (PowerShell)
Copy-Item app/env.example .env.local
```

2) Fill required env vars in `.env.local`

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-strong-random-secret
OPENAI_API_KEY=sk-...
# Optional (defaults to gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

3) Install dependencies and run migrations

```bash
npm i
npx prisma migrate dev --name init
```

4) Start the dev server

```bash
npm run dev
```

### Main Routes

- `/register`, `/login` — Authentication (email/password)
- `/dashboard` — Saved resumes and cover letters
- `/resume` — Paste and optimize resume text
- `/cover-letter` — Generate tailored cover letters

### API Endpoints

- `POST /api/register` — Register user
- `POST /api/generate-resume` — Optimize resume using OpenAI (default `gpt-4o-mini`)
- `POST /api/generate-cover` — Generate cover letter using OpenAI (default `gpt-4o-mini`)
- `GET /api/export/resume/:id` — Download resume as .txt
- `GET /api/export/cover/:id` — Download cover letter as .txt

### Environment Variables

```
DATABASE_URL           # PostgreSQL connection string (URL-encode special chars in password)
NEXTAUTH_URL           # e.g. http://localhost:3000
NEXTAUTH_SECRET        # 32-byte base64 string
OPENAI_API_KEY         # Your OpenAI key
OPENAI_MODEL           # Optional (e.g., gpt-4o, gpt-4o-mini)
```

Tip: Generate a secret on any platform

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Development Notes

- Prisma client is auto-generated on install via `postinstall` script.
- Credentials sign-in uses JWT session strategy by default.
- Secure API routes rely on `getServerSession`.

### Project Structure

```
app/
  api/
    auth/[...nextauth]/route.ts
    generate-resume/route.ts
    generate-cover/route.ts
    export/
      resume/[id]/route.ts
      cover/[id]/route.ts
    register/route.ts
  dashboard/page.tsx
  resume/page.tsx
  cover-letter/page.tsx
  components/Navbar.tsx
lib/
  db.ts
  auth.ts
prisma/
  schema.prisma
```

### License

MIT
