resume-ai — AI-powered Resume & Cover Letter Generator built with Next.js 14 (App Router), TypeScript, TailwindCSS, Prisma, NextAuth, and OpenAI.

Quick start

1. Copy environment variables

```
cp app/env.example .env.local
```

2. Set `DATABASE_URL`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY` in `.env.local`.

3. Install and migrate

```
npm i
npx prisma migrate dev --name init
```

4. Run the dev server

```
npm run dev
```

Main routes

- `/register`, `/login` for auth (email/password)
- `/dashboard` to view saved resumes and cover letters
- `/resume` to paste and optimize resume text
- `/cover-letter` to generate tailored cover letters

API

- `POST /api/register` — register user
- `POST /api/generate-resume` — optimize resume using OpenAI (defaults to `gpt-4o-mini`)
- `POST /api/generate-cover` — generate cover letter using OpenAI (defaults to `gpt-4o-mini`)
- `GET /api/export/resume/:id` — download resume as .txt
- `GET /api/export/cover/:id` — download cover letter as .txt

Tech notes

- Prisma Adapter for NextAuth with database sessions
- Models: `User`, `Resume`, `CoverLetter`, and NextAuth tables
- Secured API routes via `getServerSession`
