"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResumePage() {
  const [title, setTitle] = useState("");
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data.optimized);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Optimize Resume</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Resume title (optional, e.g., Backend v2)"
          className="w-full p-3 border rounded"
        />
        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="Paste your resume text here..."
          className="w-full h-64 p-3 border rounded"
        />
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste job description (optional, improves targeting)"
          className="w-full h-40 p-3 border rounded"
        />
        <div className="flex gap-3">
          <button disabled={loading || !resume} className="px-4 py-2 bg-black text-white rounded disabled:opacity-50">
            {loading ? "Optimizing..." : "Optimize"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard")} className="px-4 py-2 border rounded">
            Go to Dashboard
          </button>
        </div>
      </form>

      {result && (
        <div className="rounded border p-4">
          <h2 className="font-medium mb-2">Optimized Resume</h2>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}


