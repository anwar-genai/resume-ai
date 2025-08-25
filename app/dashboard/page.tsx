import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold">Please sign in</h1>
        <p className="mt-2 text-sm text-gray-600">You must be signed in to view your documents.</p>
        <Link className="mt-4 inline-block underline" href="/login">Go to login</Link>
      </div>
    );
  }

  const userId = (session as any).userId as string;
  const [resumes, letters] = await Promise.all([
    prisma.resume.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.coverLetter.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Documents</h1>
        <nav className="flex gap-3 text-sm">
          <Link className="px-3 py-1.5 rounded bg-black text-white" href="/resume">Optimize Resume</Link>
          <Link className="px-3 py-1.5 rounded border" href="/cover-letter">Generate Cover Letter</Link>
        </nav>
      </header>

      <section>
        <h2 className="text-lg font-medium mb-2">Resumes</h2>
        <div className="grid gap-3">
          {resumes.length === 0 && <p className="text-sm text-gray-600">No resumes yet.</p>}
          {resumes.map((r) => (
            <div key={r.id} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleString()}</p>
                <div className="flex gap-2">
                  <Link className="underline text-sm" href={`/api/export/resume/${r.id}`}>Download</Link>
                </div>
              </div>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-900">{r.optimizedContent ?? r.content}</pre>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-2">Cover Letters</h2>
        <div className="grid gap-3">
          {letters.length === 0 && <p className="text-sm text-gray-600">No cover letters yet.</p>}
          {letters.map((c) => (
            <div key={c.id} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{c.jobTitle} @ {c.company}</p>
                <div className="flex gap-2">
                  <Link className="underline text-sm" href={`/api/export/cover/${c.id}`}>Download</Link>
                </div>
              </div>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-900">{c.content}</pre>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


