"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import { Input, Textarea } from "@/app/components/ui/Input";

export default function CoverLetterPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string>("");
  const [resumes, setResumes] = useState<Array<{ id: string; title: string | null; createdAt: string }>>([]);
  const [jobLink, setJobLink] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/resumes");
        if (r.ok) {
          const data = await r.json();
          setResumes(data.items || []);
          if (data.items?.length) setResumeId(data.items[0].id);
        }
      } catch {}
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jobTitle, 
          company, 
          clientName: clientName || undefined,
          jobLink: jobLink || undefined,
          jobDescription: jobDescription || undefined, 
          resumeId: resumeId || undefined,
          resumeText: resumeText || undefined
        }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const errBody = contentType.includes("application/json") ? await res.json() : await res.text();
        const errMsg = typeof errBody === "string" ? errBody : errBody?.error;
        throw new Error(errMsg || "Failed");
      }
      const data = contentType.includes("application/json") ? await res.json() : { content: await res.text() };
      setResult(data.content);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">
          Cover Letter Generator
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Create compelling cover letters tailored to specific job opportunities with AI-powered personalization
        </p>
      </div>
      
      {/* Main Form Card */}
      <GlassCard className="p-8">
        <form onSubmit={onSubmit} className="space-y-8">
          {/* Job Information Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Job Information</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-semibold text-gray-900 dark:text-white">
                    Job Title
                  </label>
                  <span className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">Required</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Frontend Developer, Marketing Manager"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    The specific position you're applying for
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-semibold text-gray-900 dark:text-white">
                    Company Name
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">Optional</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g., Microsoft, Google, Startup Inc."
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    The company you're applying to
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-semibold text-gray-900 dark:text-white">
                    Client Name
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">Optional</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g., John Smith (for freelance/contract work)"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    If this is for freelance or contract work with an individual
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-semibold text-gray-900 dark:text-white">
                    Job Link
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">Optional</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={jobLink}
                    onChange={(e) => setJobLink(e.target.value)}
                    placeholder="https://company.com/job-posting"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Link to the job posting for better context
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Job Description Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-900 dark:text-white">
                Job Description
              </label>
              <span className="text-xs text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">Recommended</span>
            </div>
            <div className="space-y-2">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here... This helps create a more targeted and relevant cover letter."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none h-32"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Including the job description helps create a more targeted cover letter
              </p>
            </div>
          </div>
          
          {/* Resume Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-900 dark:text-white">
                Resume Source
              </label>
              <span className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">Required</span>
            </div>
            
            {resumes.length > 0 && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Use Existing Resume
                  </label>
                  <select 
                    value={resumeId} 
                    onChange={(e) => setResumeId(e.target.value)} 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title || `Resume from ${new Date(r.createdAt).toLocaleDateString()}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select a previously saved resume to use as the foundation
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <div className="h-px bg-gray-300 dark:bg-zinc-600 flex-1"></div>
                  <span>OR</span>
                  <div className="h-px bg-gray-300 dark:bg-zinc-600 flex-1"></div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {resumes.length > 0 ? "Paste Resume Text" : "Resume Content"}
              </label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your complete resume text here... Include all sections like experience, education, skills, etc."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none h-40"
                required={!resumeId}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {resumes.length > 0 
                  ? "Alternatively, paste your resume text here instead of selecting above"
                  : "Your complete resume content is required to generate a personalized cover letter"
                }
              </p>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="pt-6 border-t border-gray-200 dark:border-zinc-700">
            <div className="flex justify-center">
              <Button 
                type="submit" 
                variant="primary" 
                size="lg"
                disabled={loading || !jobTitle || (!resumeId && !resumeText)}
                glow
                className="min-w-[200px]"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </GlassCard>

      {result && (
        <GlassCard className="p-8" glow>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">
                Generated Cover Letter
              </h2>
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Generation Complete
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-6 border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cover Letter Content</h3>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(result);
                      // You could add a toast notification here
                    }}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([result], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `cover-letter-${jobTitle || 'application'}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-gray-200 dark:border-zinc-600 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-white font-mono">{result}</pre>
              </div>
            </div>
            
            <div className="flex justify-center gap-4 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push("/upwork-proposal")}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Create Proposal
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Dashboard
              </Button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}