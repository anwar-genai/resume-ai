"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CoverLetterPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string>("");
  const [resumes, setResumes] = useState<Array<{ id: string; title: string | null; createdAt: string }>>([]);
  const [jobDescription, setJobDescription] = useState("");

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
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

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
      <h1 className="text-2xl font-semibold">Generate Cover Letter</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Job Title"
          className="w-full p-3 border rounded"
        />
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company"
          className="w-full p-3 border rounded"
        />
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste job description (recommended)"
          className="w-full h-40 p-3 border rounded"
        />
        <div>
          <label className="block text-sm text-gray-600 mb-1">Use resume</label>
          <select value={resumeId} onChange={(e) => setResumeId(e.target.value)} className="w-full p-3 border rounded">
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>{r.title || `Resume from ${new Date(r.createdAt).toLocaleString()}`}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button disabled={loading || !jobTitle || !company} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50">
            {loading ? "Generating..." : "Generate"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard")} className="px-4 py-2 border rounded">
            Go to Dashboard
          </button>
        </div>
      </form>

      {result && (
        <div className="rounded border p-4">
          <h2 className="font-medium mb-2">Cover Letter</h2>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}


