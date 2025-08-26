"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import { Input, Textarea } from "@/app/components/ui/Input";

export default function UpworkProposalPage() {
  const [projectTitle, setProjectTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [budget, setBudget] = useState("");
  const [resumeId, setResumeId] = useState<string>("");
  const [resumes, setResumes] = useState<Array<{ id: string; title: string | null; createdAt: string }>>([]);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
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
      const res = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle,
          clientName: clientName || undefined,
          projectDetails: projectDetails || undefined,
          budget: budget || undefined,
          resumeId: resumeId || undefined,
          resumeText: resumeText || undefined,
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
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">Generate Upwork Proposal</h1>

      <GlassCard className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <Input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            placeholder="e.g., AI Agent for Lead Qualification, Weekly Tutoring, etc."
            label="Project Title"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client Name (optional)"
              label="Client Name (Optional)"
            />
            <Input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., $500-1k or Hourly $30-50"
              label="Budget (Optional)"
            />
          </div>

          <Textarea
            value={projectDetails}
            onChange={(e) => setProjectDetails(e.target.value)}
            placeholder="Paste the job post / notes / constraints (optional)"
            label="Project Details (Optional)"
            className="h-32"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Use Existing Resume (Optional)</label>
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
            <p className="text-xs text-gray-500 mt-2">Or paste your resume text below.</p>
          </div>

          <Textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text if you don't want to use a saved resume..."
            label="Resume Text (Optional)"
            className="h-40"
          />

          <div className="flex flex-wrap gap-3 pt-2">
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading || !projectTitle || (!resumeId && !resumeText)}
              glow
            >
              {loading ? "Generating..." : "Generate Proposal"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </form>
      </GlassCard>

      {result && (
        <GlassCard className="p-6" glow>
          <h2 className="font-medium mb-4 text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">Generated Proposal</h2>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{result}</pre>
        </GlassCard>
      )}
    </div>
  );
}


