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
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">Optimize Resume</h1>
      
      <GlassCard className="p-6">
        {/* Usage summary for quick visibility */}
        <div className="mb-4">
          <span className="text-sm text-gray-600">Monthly usage is shown on the Dashboard.</span>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
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
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload PDF
            </Button>
            <span className="text-xs text-gray-500">Extract text automatically from your resume.</span>
          </div>
          
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resume title (optional, e.g., Backend v2)"
            label="Resume Title"
          />
          
          <Textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            placeholder="Paste your resume text here..."
            label="Resume Content"
            className="h-48"
          />
          
          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description (optional, improves targeting)"
            label="Job Description (Optional)"
            className="h-32"
          />
          
          <div className="flex flex-wrap gap-3">
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading || !resume}
              glow
            >
              {loading ? "Optimizing..." : "Optimize Resume"}
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => router.push("/cover-letter")}
            >
              Generate Cover Letter
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
          <h2 className="font-medium mb-4 text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">Optimized Resume</h2>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{result}</pre>
        </GlassCard>
      )}
    </div>
  );
}