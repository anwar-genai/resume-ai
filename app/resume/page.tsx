"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import { Input, Textarea } from "@/app/components/ui/Input";

export default function ResumePage() {
  const [title, setTitle] = useState("");
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<"upload" | "manual">("manual");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function onUpload(file: File) {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload-resume", { method: "POST", body: form });
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const errText = contentType.includes("application/json") ? (await res.json())?.error : await res.text();
        throw new Error(errText || "Upload failed");
      }
      const data = contentType.includes("application/json") ? await res.json() : { text: await res.text() };
      setResume((prev) => (prev ? prev + "\n\n" : "") + (data.text || ""));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription: jobDescription || undefined, title: title || undefined }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        const errBody = contentType.includes("application/json") ? await res.json() : await res.text();
        const errMsg = typeof errBody === "string" ? errBody : errBody?.error;
        throw new Error(errMsg || "Failed");
      }
      const data = contentType.includes("application/json") ? await res.json() : { optimized: await res.text() };
      setResult(data.optimized);
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
          Resume Optimizer
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Enhance your resume with AI-powered optimization tailored to specific job requirements
        </p>
      </div>
      
      {/* Main Form Card */}
      <GlassCard className="p-8">
        {/* Usage Info */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Usage Information</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Your monthly usage statistics are displayed on the Dashboard. Each optimization counts towards your usage limit.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          {/* Input Method Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resume Input Method</h3>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputMethod("manual")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    inputMethod === "manual"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-600"
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Type Manually
                </button>
                <button
                  type="button"
                  onClick={() => setInputMethod("upload")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    inputMethod === "upload"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-600"
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload PDF
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {inputMethod === "manual" 
                    ? "Type or paste your resume content directly" 
                    : "Upload your resume PDF to extract text automatically"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* File Upload Section - Only show when upload is selected */}
          {inputMethod === "upload" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Resume</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">PDF Only</span>
              </div>
              <div className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 10 * 1024 * 1024) {
                        alert("File too large. Max 10MB");
                        e.currentTarget.value = "";
                        return;
                      }
                      onUpload(f);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload PDF
                </Button>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Extract text from your resume PDF</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Supports PDF files up to 10MB</p>
                </div>
              </div>
              
              {!resume && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Please upload a PDF file to extract resume content, or switch to manual input to type your resume.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Resume Title Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-900 dark:text-white">
                Resume Title
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">Optional</span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Developer Resume v2, Marketing Manager Profile"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Give your resume a descriptive name to help you identify it later
              </p>
            </div>
          </div>
          
          {/* Resume Content Section - Only show when manual input is selected */}
          {inputMethod === "manual" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resume Content
                </label>
                <span className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">Required</span>
              </div>
              <div className="space-y-2">
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  placeholder="Paste your complete resume text here... Include all sections like experience, education, skills, etc."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none h-48"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Include your complete resume content for best optimization results
                </p>
              </div>
            </div>
          )}

          {/* Show uploaded content when file is uploaded */}
          {inputMethod === "upload" && resume && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-lg font-semibold text-gray-900 dark:text-white">
                  Extracted Resume Content
                </label>
                <span className="text-xs text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">Ready</span>
              </div>
              <div className="space-y-2">
                <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700 max-h-48 overflow-y-auto">
                  <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                    {resume}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Resume content extracted from uploaded PDF. You can edit this text if needed.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setInputMethod("manual");
                    // Keep the resume content but allow editing
                  }}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Content
                </Button>
              </div>
            </div>
          )}
          
          {/* Job Description Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-900 dark:text-white">
                Target Job Description
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">Optional</span>
            </div>
            <div className="space-y-2">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description you're applying for... This helps tailor the optimization to specific requirements."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none h-32"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Providing a job description helps create a more targeted resume optimization
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
                disabled={loading || !resume || (inputMethod === "upload" && !resume)}
                glow
                className="min-w-[200px]"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Optimize Resume
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
                Optimized Resume
              </h2>
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Optimization Complete
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-6 border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Optimized Content</h3>
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
                      a.download = `${title || 'optimized-resume'}.txt`;
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
                onClick={() => router.push("/cover-letter")}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Create Cover Letter
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