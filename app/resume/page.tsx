"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import { FileText, PencilLine } from "lucide-react";

export default function ResumePage() {
  const [title, setTitle] = useState("");
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
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
    try {
      const res = await fetch("/api/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription: jobDescription || undefined, title: title || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429 && data.limitReached) {
          throw new Error(`${data.error}. Upgrade your plan at /pricing for higher limits.`);
        }
        if (res.status === 403 && data.needsVerification) {
          throw new Error("Please verify your email to generate documents.");
        }
        throw new Error(data.error || "Generation failed");
      }
      // Hand the JD to the builder's ATS panel for a seamless iterate → re-score loop.
      if (jobDescription.trim()) sessionStorage.setItem("resumeJd", jobDescription);
      // The builder is the single editing/preview/export surface; AI just seeds it.
      router.push(`/resume/builder?id=${data.id}`);
    } catch (err) {
      alert((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">
          Create a resume
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Start from an existing resume and let AI tailor it to a job — or build one from scratch.
          Either way you finish in the editor, with a live preview and export.
        </p>
      </div>

      {/* Two ways to start */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GlassCard className="p-5 ring-2 ring-indigo-500/40" hover={false}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Optimize an existing resume</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Paste or upload your resume, add a job description, and AI tailors it. You&apos;re here.
              </p>
            </div>
          </div>
        </GlassCard>

        <button type="button" onClick={() => router.push("/resume/builder")} className="text-left cursor-pointer">
          <GlassCard className="p-5 h-full" hover>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                <PencilLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                  Build from scratch <span aria-hidden>→</span>
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Open a blank structured editor and fill in the sections yourself.
                </p>
              </div>
            </div>
          </GlassCard>
        </button>
      </div>

      {/* Optimize form */}
      <GlassCard className="p-8">
        <form onSubmit={onSubmit} className="space-y-8">
          {/* Input Method Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resume input method</h3>
            <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputMethod("manual")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                    inputMethod === "manual"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-600"
                  }`}
                >
                  Type / paste
                </button>
                <button
                  type="button"
                  onClick={() => setInputMethod("upload")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                    inputMethod === "upload"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-600"
                  }`}
                >
                  Upload PDF
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                {inputMethod === "manual"
                  ? "Type or paste your resume content directly."
                  : "Upload your resume PDF to extract its text automatically."}
              </p>
            </div>
          </div>

          {/* File Upload — only when upload is selected */}
          {inputMethod === "upload" && (
            <div className="space-y-3">
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
                <Button type="button" variant="secondary" size="md" onClick={() => fileInputRef.current?.click()}>
                  Choose PDF
                </Button>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Extract text from your resume PDF</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PDF only, up to 10MB. You can edit the extracted text below.</p>
                </div>
              </div>
            </div>
          )}

          {/* Resume title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-900 dark:text-white">Resume title</label>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">Optional</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Developer Resume, Marketing Manager Profile"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Resume content (the extracted PDF text lands here too, editable) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-900 dark:text-white">Resume content</label>
              <span className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">Required</span>
            </div>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your complete resume text here — experience, education, skills, etc."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none h-48"
              required
            />
          </div>

          {/* Job description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-lg font-semibold text-gray-900 dark:text-white">Target job description</label>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">Optional</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description you're applying for — this tailors the optimization and powers the ATS match score in the editor."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-none h-32"
            />
          </div>

          {/* Submit */}
          <div className="pt-6 border-t border-gray-200 dark:border-zinc-700 flex justify-center">
            <Button type="submit" variant="primary" size="lg" disabled={loading || !resume} glow className="min-w-[220px]">
              {loading ? "Optimizing…" : "Optimize & open in editor"}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
