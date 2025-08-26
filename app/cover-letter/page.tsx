"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import { Input, Textarea } from "@/app/components/ui/Input";

export default function CoverLetterPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string>("");
  const [resumes, setResumes] = useState<Array<{ id: string; title: string | null; createdAt: string }>>([]);
  const [jobDescription, setJobDescription] = useState("");
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
        body: JSON.stringify({ jobTitle, company, jobDescription: jobDescription || undefined, resumeId: resumeId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data.content);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">Generate Cover Letter</h1>
      
      <GlassCard className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Frontend Developer"
              label="Job Title"
            />
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Microsoft"
              label="Company"
            />
          </div>
          
          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description to create a more targeted cover letter..."
            label="Job Description (Recommended)"
            className="h-32"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Use Resume</label>
            <select 
              value={resumeId} 
              onChange={(e) => setResumeId(e.target.value)} 
              className="w-full px-4 py-3 rounded-lg border border-white/20 dark:border-zinc-700/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title || `Resume from ${new Date(r.createdAt).toLocaleDateString()}`}
                </option>
              ))}
            </select>
            {resumes.length === 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                No resumes found. <span className="underline cursor-pointer" onClick={() => router.push("/resume")}>Create one first</span>
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading || !jobTitle || !company || !resumeId}
              glow
            >
              {loading ? "Generating..." : "Generate Cover Letter"}
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => router.push("/resume")}
            >
              Optimize Resume
            </Button>
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => router.push("/dashboard")}
            >
              Dashboard
            </Button>
          </div>
        </form>
      </GlassCard>

      {result && (
        <GlassCard className="p-6" glow>
          <h2 className="font-medium mb-4 text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">Generated Cover Letter</h2>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{result}</pre>
        </GlassCard>
      )}
    </div>
  );
}