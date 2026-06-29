"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import Badge from "@/app/components/ui/Badge";
import UsageDisplay from "@/app/components/UsageDisplay";
import VerifyEmailBanner from "@/app/components/VerifyEmailBanner";
import Skeleton, { SkeletonCard } from "@/app/components/ui/Skeleton";
const DocumentPreview = dynamic(() => import("@/app/components/DocumentPreview"), { ssr: false });
import { useState, useEffect, use } from "react";

export default function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const [previewDoc, setPreviewDoc] = useState<{
    id: string;
    type: "resume" | "cover" | "proposal";
    title: string;
    metadata?: any;
  } | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "resumes" | "covers" | "proposals";
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [documents, setDocuments] = useState<{
    resumes: any[];
    letters: any[];
    proposals: any[];
  }>({ resumes: [], letters: [], proposals: [] });

  // Initial tab comes from ?tab=, then is managed client-side for instant switching
  const params = searchParams ? use(searchParams) : undefined;
  const [activeTab, setActiveTab] = useState<"resumes" | "covers" | "proposals">(
    params?.tab === "covers" ? "covers" : params?.tab === "proposals" ? "proposals" : "resumes"
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setError(false);
    try {
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();

      if (!sessionData || !sessionData.user) {
        setLoading(false);
        return;
      }

      setSession(sessionData);

      // Fetch documents
      const [resumesRes, lettersRes, proposalsRes] = await Promise.all([
        fetch("/api/user/documents?type=resumes"),
        fetch("/api/user/documents?type=covers"),
        fetch("/api/user/documents?type=proposals"),
      ]);

      if (!resumesRes.ok || !lettersRes.ok || !proposalsRes.ok) {
        throw new Error("Failed to load documents");
      }

      const [resumes, letters, proposals] = await Promise.all([
        resumesRes.json(),
        lettersRes.json(),
        proposalsRes.json(),
      ]);

      setDocuments({ resumes, letters, proposals });
    } catch (error) {
      console.error("Failed to load data:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    setLoading(true);
    loadData();
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <SkeletonCard />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <GlassCard key={i} className="p-6">
                <Skeleton variant="rectangular" height="120px" />
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full p-8 text-center" glow>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/15 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Couldn't load your dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Something went wrong while fetching your documents. Please try again.
          </p>
          <Button variant="primary" size="lg" glow className="w-full" onClick={retry}>
            Try Again
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (!session || !session.user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
        <GlassCard className="max-w-md w-full p-8 text-center" glow>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">
            Sign In Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to be signed in to view your documents and access all features.
          </p>
          <Link href="/login">
            <Button variant="primary" size="lg" glow className="w-full">
              Sign In to Continue
            </Button>
          </Link>
        </GlassCard>
      </div>
    );
  }

  const { resumes, letters, proposals } = documents;

  // Calculate stats
  const totalDocuments = resumes.length + letters.length + proposals.length;
  const isEmpty = totalDocuments === 0;

  // Typed, sorted recent items across all document kinds
  type RecentItem = {
    id: string;
    createdAt: string;
    _type: "resume" | "cover" | "proposal";
    [k: string]: any;
  };
  const recentActivity: RecentItem[] = [
    ...resumes.map((r: any) => ({ ...r, _type: "resume" as const })),
    ...letters.map((c: any) => ({ ...c, _type: "cover" as const })),
    ...proposals.map((p: any) => ({ ...p, _type: "proposal" as const })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const titleFor = (item: RecentItem) =>
    item._type === "resume"
      ? item.title || "Untitled Resume"
      : item._type === "cover"
      ? `${item.jobTitle} @ ${item.company}`
      : item.projectTitle;

  const labelFor: Record<RecentItem["_type"], string> = {
    resume: "Resume",
    cover: "Cover Letter",
    proposal: "Proposal",
  };

  const openPreview = (item: RecentItem) =>
    setPreviewDoc({
      id: item.id,
      type: item._type,
      title: titleFor(item),
      metadata: {
        createdAt: item.createdAt,
        company: item.company,
        jobTitle: item.jobTitle,
        clientName: item.clientName,
      },
    });

  async function performDelete() {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    setDeleting(true);
    try {
      const res = await fetch(`/api/user/documents?type=${type}&id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      // Optimistically drop the document from local state
      setDocuments((prev) => ({
        resumes: type === "resumes" ? prev.resumes.filter((d) => d.id !== id) : prev.resumes,
        letters: type === "covers" ? prev.letters.filter((d) => d.id !== id) : prev.letters,
        proposals: type === "proposals" ? prev.proposals.filter((d) => d.id !== id) : prev.proposals,
      }));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Couldn't delete that document. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const deleteButton = (type: "resumes" | "covers" | "proposals", id: string, title: string) => (
    <Button
      variant="ghost"
      size="sm"
      className="cursor-pointer px-2 text-red-500 hover:text-red-600"
      aria-label="Delete document"
      onClick={() => setConfirmDelete({ type, id, title })}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </Button>
  );

  return (
    <div className="min-h-[calc(100vh-64px)] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <VerifyEmailBanner />
        {/* Header with stats */}
        <header className="grid gap-6 lg:grid-cols-[1fr,auto]">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500 animate-fade-in">
              Welcome back, {session.user?.name || "User"}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your AI-generated documents and create new ones.
            </p>
          </div>
          {/* New users are driven by the onboarding card below; returning users get a
              focused create action here (the rest live in the navbar + tabs) */}
          {!isEmpty && (
            <div className="flex flex-wrap gap-3">
              <Link href="/resume" className="cursor-pointer">
                <Button variant="primary" size="md" glow className="cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  New Resume
                </Button>
              </Link>
              <Link href="/resume/builder" className="cursor-pointer">
                <Button variant="secondary" size="md" className="cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Build from scratch
                </Button>
              </Link>
            </div>
          )}
      </header>

        {/* New users get an onboarding flow; returning users get their stats */}
        {isEmpty ? (
          <GlassCard className="p-8 animate-slide-up" glow>
            <h2 className="text-xl font-bold mb-1">Let's create your first document</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Three steps from a blank page to a job-ready resume.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Add your resume",
                  desc: "Paste or upload your current resume, or build one from scratch.",
                },
                {
                  step: "2",
                  title: "Optimize for a job",
                  desc: "Drop in a job description — we tailor and ATS-score it.",
                },
                {
                  step: "3",
                  title: "Download & apply",
                  desc: "Export a polished PDF, plus a matching cover letter.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="rounded-lg border border-white/20 dark:border-zinc-700/50 bg-white/40 dark:bg-zinc-900/40 p-4"
                >
                  <div className="w-8 h-8 mb-3 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-white text-sm font-bold flex items-center justify-center">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/resume">
                <Button variant="primary" size="md" glow>
                  Optimize a resume
                </Button>
              </Link>
              <Link href="/resume/builder">
                <Button variant="secondary" size="md">
                  Build from scratch
                </Button>
              </Link>
            </div>
          </GlassCard>
        ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Documents</p>
                <p className="text-3xl font-bold mt-1">{totalDocuments}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Resumes</p>
                <p className="text-3xl font-bold mt-1">{resumes.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cover Letters</p>
                <p className="text-3xl font-bold mt-1">{letters.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <span className="text-2xl">✉️</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Proposals</p>
                <p className="text-3xl font-bold mt-1">{proposals.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">💼</span>
              </div>
            </div>
          </GlassCard>
        </div>
        )}

      {/* Usage Display */}
        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
      <UsageDisplay />
        </div>

        {/* Continue where you left off — only adds value once there are more docs than the strip shows */}
        {totalDocuments > recentActivity.length && (
          <div className="animate-slide-up" style={{ animationDelay: "150ms" }}>
            <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Continue where you left off
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {recentActivity.map((item) => (
                <button
                  key={`${item._type}-${item.id}`}
                  onClick={() => openPreview(item)}
                  className="text-left cursor-pointer"
                >
                  <GlassCard className="p-4 h-full flex flex-col" hover>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {titleFor(item)}
                      </h3>
                      <Badge
                        variant={item._type === "cover" ? "success" : "info"}
                        size="sm"
                      >
                        {labelFor[item._type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </GlassCard>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Document Tabs */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="border-b border-gray-200 dark:border-zinc-700 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <nav className="flex gap-8 -mb-px">
          <button
                type="button"
                onClick={() => setActiveTab("resumes")}
                className={`
                  relative py-3 px-1 text-sm font-medium transition-colors cursor-pointer
                  ${activeTab === "resumes"
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span>Resumes</span>
                  <Badge variant={activeTab === "resumes" ? "info" : "default"} size="sm">
                    {resumes.length}
                  </Badge>
                </span>
                {activeTab === "resumes" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                )}
          </button>

          <button
                type="button"
                onClick={() => setActiveTab("covers")}
                className={`
                  relative py-3 px-1 text-sm font-medium transition-colors cursor-pointer
                  ${activeTab === "covers"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span>Cover Letters</span>
                  <Badge variant={activeTab === "covers" ? "success" : "default"} size="sm">
                    {letters.length}
                  </Badge>
                </span>
                {activeTab === "covers" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />
                )}
          </button>

          <button
                type="button"
                onClick={() => setActiveTab("proposals")}
                className={`
                  relative py-3 px-1 text-sm font-medium transition-colors cursor-pointer
                  ${activeTab === "proposals"
                    ? "text-purple-600 dark:text-purple-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  <span>Proposals</span>
                  <Badge variant={activeTab === "proposals" ? "info" : "default"} size="sm">
                    {proposals.length}
                  </Badge>
                </span>
                {activeTab === "proposals" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
                )}
          </button>
            </nav>
      </div>

          {/* Content */}
          <div className="mt-8">
      {activeTab === "resumes" ? (
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {resumes.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <span className="text-2xl">📄</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">No resumes yet</p>
                    <Link href="/resume">
                      <Button variant="primary" size="sm">Create Your First Resume</Button>
                    </Link>
                  </div>
                ) : (
                  resumes.map((r: any, index: number) => (
                    <div
                      key={r.id}
                      className="animate-scale-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <GlassCard className="p-5 h-full flex flex-col" hover>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {r.title || "Untitled Resume"}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(r.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                </div>
                          <Badge variant="info" size="sm">Resume</Badge>
              </div>
                        <div className="mt-auto flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 cursor-pointer"
                            onClick={() => setPreviewDoc({
                              id: r.id,
                              type: "resume",
                              title: r.title || "Untitled Resume",
                              metadata: { createdAt: r.createdAt }
                            })}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                          </Button>
                          <Link href={`/cover-letter?resumeId=${r.id}`} className="flex-1 cursor-pointer">
                            <Button variant="ghost" size="sm" className="w-full cursor-pointer">
                              Use for Cover
                            </Button>
                </Link>
                          {deleteButton("resumes", r.id, r.title || "Untitled Resume")}
              </div>
            </GlassCard>
                    </div>
                  ))
                )}
        </section>
      ) : activeTab === "covers" ? (
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {letters.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <span className="text-2xl">✉️</span>
                </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">No cover letters yet</p>
                    <Link href="/cover-letter">
                      <Button variant="primary" size="sm">Create Cover Letter</Button>
                </Link>
                  </div>
                ) : (
                  letters.map((c: any, index: number) => (
                    <div
                      key={c.id}
                      className="animate-scale-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <GlassCard className="p-5 h-full flex flex-col" hover>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {c.jobTitle}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                              @ {c.company}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(c.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <Badge variant="success" size="sm">Cover</Badge>
                        </div>
                        {c.resume && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            Based on: {c.resume.title || "Resume"}
                          </p>
                        )}
                        <div className="mt-auto flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 cursor-pointer"
                            onClick={() => setPreviewDoc({
                              id: c.id,
                              type: "cover",
                              title: `${c.jobTitle} @ ${c.company}`,
                              metadata: {
                                company: c.company,
                                jobTitle: c.jobTitle,
                                createdAt: c.createdAt
                              }
                            })}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Letter
                          </Button>
                          {deleteButton("covers", c.id, `${c.jobTitle} @ ${c.company}`)}
              </div>
            </GlassCard>
                    </div>
                  ))
                )}
        </section>
      ) : (
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {proposals.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <span className="text-2xl">💼</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">No proposals yet</p>
                    <Link href="/upwork-proposal">
                      <Button variant="primary" size="sm">Create Proposal</Button>
                    </Link>
                  </div>
                ) : (
                  proposals.map((p: any, index: number) => (
                    <div
                      key={p.id}
                      className="animate-scale-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <GlassCard className="p-5 h-full flex flex-col" hover>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                              {p.projectTitle}
                            </h3>
                  {p.clientName && (
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Client: {p.clientName}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(p.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                </div>
                          <Badge variant="info" size="sm">Proposal</Badge>
              </div>
                        <div className="mt-auto flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 cursor-pointer"
                            onClick={() => setPreviewDoc({
                              id: p.id,
                              type: "proposal",
                              title: p.projectTitle,
                              metadata: {
                                clientName: p.clientName,
                                createdAt: p.createdAt
                              }
                            })}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Proposal
                          </Button>
                          {deleteButton("proposals", p.id, p.projectTitle)}
              </div>
            </GlassCard>
                    </div>
                  ))
                )}
        </section>
            )}
          </div>
        </div>
      </div>
      
      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreview
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          documentId={previewDoc.id}
          documentType={previewDoc.type}
          title={previewDoc.title}
          metadata={previewDoc.metadata}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => !deleting && setConfirmDelete(null)}
        >
          <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
          <GlassCard className="p-6" hover={false}>
            <h2 className="text-lg font-bold mb-1">Delete this document?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              <span className="font-medium text-gray-900 dark:text-white">{confirmDelete.title}</span>{" "}
              will be permanently removed. This can't be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="md"
                disabled={deleting}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
              <Button variant="danger" size="md" disabled={deleting} onClick={performDelete}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
