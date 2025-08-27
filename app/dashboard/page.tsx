"use client";

import Link from "next/link";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import Badge from "@/app/components/ui/Badge";
import UsageDisplay from "@/app/components/UsageDisplay";
import Skeleton, { SkeletonCard } from "@/app/components/ui/Skeleton";
import DocumentPreview from "@/app/components/DocumentPreview";
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
  const [documents, setDocuments] = useState<{
    resumes: any[];
    letters: any[];
    proposals: any[];
  }>({ resumes: [], letters: [], proposals: [] });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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
      
      const [resumes, letters, proposals] = await Promise.all([
        resumesRes.json(),
        lettersRes.json(),
        proposalsRes.json(),
      ]);
      
      setDocuments({ resumes, letters, proposals });
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
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
          <p className="text-gray-600 dark:text-gray-400 mb-6">
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
  
  // Unwrap searchParams using React.use() for Next.js 15
  const params = searchParams ? use(searchParams) : { tab: undefined };
  const activeTab = (params?.tab === "covers" ? "covers" : params?.tab === "proposals" ? "proposals" : "resumes") as "resumes" | "covers" | "proposals";
  
  // Calculate stats
  const totalDocuments = resumes.length + letters.length + proposals.length;
  const recentActivity = [...resumes, ...letters, ...proposals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-[calc(100vh-64px)] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with stats */}
        <header className="grid gap-6 lg:grid-cols-[1fr,auto]">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500 animate-fade-in">
              Welcome back, {session.user?.name || "User"}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your AI-generated documents and create new ones.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/resume" className="cursor-pointer">
              <Button variant="primary" size="md" glow className="cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Resume
              </Button>
            </Link>
            <Link href="/cover-letter" className="cursor-pointer">
              <Button variant="secondary" size="md" className="cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Cover Letter
              </Button>
          </Link>
            <Link href="/upwork-proposal" className="cursor-pointer">
              <Button variant="secondary" size="md" className="cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Proposal
              </Button>
          </Link>
          </div>
      </header>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Documents</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resumes</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cover Letters</p>
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
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Proposals</p>
                <p className="text-3xl font-bold mt-1">{proposals.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">💼</span>
              </div>
            </div>
          </GlassCard>
        </div>

      {/* Usage Display */}
        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
      <UsageDisplay />
        </div>

        {/* Document Tabs */}
        <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="border-b border-gray-200 dark:border-zinc-700 overflow-x-auto">
            <nav className="flex gap-8 -mb-px">
          <Link
                href="/dashboard?tab=resumes"
                className={`
                  relative py-3 px-1 text-sm font-medium transition-colors
                  ${activeTab === "resumes" 
                    ? "text-indigo-600 dark:text-indigo-400" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
          </Link>
              
          <Link
                href="/dashboard?tab=covers"
                className={`
                  relative py-3 px-1 text-sm font-medium transition-colors
                  ${activeTab === "covers" 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
          </Link>
              
          <Link
                href="/dashboard?tab=proposals"
                className={`
                  relative py-3 px-1 text-sm font-medium transition-colors
                  ${activeTab === "proposals" 
                    ? "text-purple-600 dark:text-purple-400" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
          </Link>
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
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No resumes yet</p>
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
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
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
                          <Link href="/cover-letter" className="flex-1 cursor-pointer">
                            <Button variant="ghost" size="sm" className="w-full cursor-pointer">
                              Use for Cover
                            </Button>
                </Link>
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
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No cover letters yet</p>
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
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {c.jobTitle}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
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
                        <div className="mt-auto">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full cursor-pointer"
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
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No proposals yet</p>
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
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {p.projectTitle}
                            </h3>
                  {p.clientName && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
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
                        <div className="mt-auto">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full cursor-pointer"
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
    </div>
  );
}
