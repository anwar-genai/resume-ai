import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import UsageDisplay from "@/app/components/UsageDisplay";

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
  const [resumes, letters, proposals] = await Promise.all([
    prisma.resume.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }) as any,
    prisma.coverLetter.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { resume: true } as any }) as any,
    prisma.proposal.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { resume: true } as any }) as any,
  ]);

  const activeTab = (searchParams?.tab === "covers" ? "covers" : searchParams?.tab === "proposals" ? "proposals" : "resumes") as "resumes" | "covers" | "proposals";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">Your Documents</h1>
        <nav className="flex gap-3 text-sm">
          <Link href="/resume">
            <Button variant="primary" size="sm">Optimize Resume</Button>
          </Link>
          <Link href="/cover-letter">
            <Button variant="secondary" size="sm">Generate Cover Letter</Button>
          </Link>
        </nav>
      </header>

      {/* Usage Display */}
      <UsageDisplay />

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
          <Link
            href={"/dashboard?tab=proposals"}
            className={`py-2 border-b-2 ${activeTab === "proposals" ? "border-black font-medium" : "border-transparent text-gray-500"}`}
          >
            Proposals ({proposals.length})
          </Link>
        </div>
      </div>

      {activeTab === "resumes" ? (
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.length === 0 && <p className="text-sm text-gray-600">No resumes yet.</p>}
          {resumes.map((r: any) => (
            <GlassCard key={r.id} className="p-4" hover>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{r.title || "Untitled Resume"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">Resume</span>
              </div>
              <div className="mt-4 flex gap-3">
                <Link href={`/api/export/resume/${r.id}`}>
                  <Button variant="ghost" size="sm">Download</Button>
                </Link>
                <Link href={`/cover-letter`}>
                  <Button variant="ghost" size="sm">Use for Cover</Button>
                </Link>
              </div>
            </GlassCard>
          ))}
        </section>
      ) : activeTab === "covers" ? (
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {letters.length === 0 && <p className="text-sm text-gray-600">No cover letters yet.</p>}
          {letters.map((c: any) => (
            <GlassCard key={c.id} className="p-4" hover>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{c.jobTitle} @ {c.company}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(c.createdAt).toLocaleString()}</p>
                  {c.resume && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">From: {c.resume.title || new Date(c.resume.createdAt).toLocaleDateString()}</p>
                  )}
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Cover</span>
              </div>
              <div className="mt-4">
                <Link href={`/api/export/cover/${c.id}`}>
                  <Button variant="ghost" size="sm">Download</Button>
                </Link>
              </div>
            </GlassCard>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {proposals.length === 0 && <p className="text-sm text-gray-600">No proposals yet.</p>}
          {proposals.map((p: any) => (
            <GlassCard key={p.id} className="p-4" hover>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{p.projectTitle}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(p.createdAt).toLocaleString()}</p>
                  {p.clientName && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Client: {p.clientName}</p>
                  )}
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">Proposal</span>
              </div>
              <div className="mt-4">
                <a href={`/api/export/proposal/${p.id}`}>
                  <Button variant="ghost" size="sm">Download</Button>
                </a>
              </div>
            </GlassCard>
          ))}
        </section>
      )}
    </div>
  );
}


