import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
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
    prisma.resume.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }) as any,
    prisma.coverLetter.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { resume: true } as any }) as any,
  ]);

  const activeTab = (searchParams?.tab === "covers" ? "covers" : "resumes") as "resumes" | "covers";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Documents</h1>
        <nav className="flex gap-3 text-sm">
          <Link className="px-3 py-1.5 rounded bg-black text-white" href="/resume">Optimize Resume</Link>
          <Link className="px-3 py-1.5 rounded border" href="/cover-letter">Generate Cover Letter</Link>
        </nav>
      </header>

      <div className="border-b overflow-x-auto">
        <div className="flex gap-6 text-sm min-w-max">
          <Link
            href={"/dashboard?tab=resumes"}
            className={`py-2 border-b-2 ${activeTab === "resumes" ? "border-black font-medium" : "border-transparent text-gray-500"}`}
          >
            Resumes ({resumes.length})
          </Link>
          <Link
            href={"/dashboard?tab=covers"}
            className={`py-2 border-b-2 ${activeTab === "covers" ? "border-black font-medium" : "border-transparent text-gray-500"}`}
          >
            Cover Letters ({letters.length})
          </Link>
        </div>
      </div>

      {activeTab === "resumes" ? (
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.length === 0 && <p className="text-sm text-gray-600">No resumes yet.</p>}
          {resumes.map((r: any) => (
            <div
              key={r.id}
              className="rounded-xl p-4 border bg-white hover:shadow-sm transition dark:bg-zinc-900 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{r.title || "Untitled Resume"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">Resume</span>
              </div>
              <div className="mt-4 flex gap-3">
                <Link className="text-sm text-indigo-700 dark:text-indigo-400 hover:underline" href={`/api/export/resume/${r.id}`}>Download</Link>
                <Link className="text-sm text-indigo-700 dark:text-indigo-400 hover:underline" href={`/cover-letter`}>Use for Cover Letter</Link>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {letters.length === 0 && <p className="text-sm text-gray-600">No cover letters yet.</p>}
          {letters.map((c: any) => (
            <div
              key={c.id}
              className="rounded-xl p-4 border bg-white hover:shadow-sm transition dark:bg-zinc-900 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{c.jobTitle} @ {c.company}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(c.createdAt).toLocaleString()}</p>
                  {c.resume && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">From resume: {c.resume.title || new Date(c.resume.createdAt).toLocaleDateString()}</p>
                  )}
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Cover</span>
              </div>
              <div className="mt-4 flex gap-3">
                <Link className="text-sm text-indigo-700 dark:text-indigo-400 hover:underline" href={`/api/export/cover/${c.id}`}>Download</Link>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}


