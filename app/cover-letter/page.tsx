"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CoverLetterPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
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
        body: JSON.stringify({ jobTitle, company }),
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


