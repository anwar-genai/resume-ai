"use client";
import { useState } from "react";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";

interface AtsResult {
  score: number;
  summary: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
}

function scoreColor(score: number) {
  if (score >= 75) return { text: "text-emerald-600", bar: "bg-emerald-500", ring: "border-emerald-500" };
  if (score >= 50) return { text: "text-amber-600", bar: "bg-amber-500", ring: "border-amber-500" };
  return { text: "text-red-600", bar: "bg-red-500", ring: "border-red-500" };
}

export default function AtsAnalysis({
  resumeText,
  jobDescription,
}: {
  resumeText: string;
  jobDescription: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AtsResult | null>(null);

  const canRun = resumeText.trim().length > 0 && jobDescription.trim().length > 0;

  async function analyze() {
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Analysis failed.");
        return;
      }
      setResult(data as AtsResult);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const c = result ? scoreColor(result.score) : scoreColor(0);

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ATS Match Score</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            See how well your resume matches the job description, and what keywords you&apos;re missing.
          </p>
        </div>
        <Button variant="primary" onClick={analyze} disabled={!canRun || loading} glow>
          {loading ? "Analyzing…" : result ? "Re-analyze" : "Analyze match"}
        </Button>
      </div>

      {!canRun && (
        <p className="mt-3 text-xs text-gray-500">
          Add both your resume and a target job description above to analyze.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-5 space-y-5">
          {/* Score */}
          <div className="flex items-center gap-4">
            <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 ${c.ring}`}>
              <span className={`text-2xl font-bold ${c.text}`}>{result.score}</span>
            </div>
            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-zinc-700">
                <div className={`h-2 rounded-full ${c.bar}`} style={{ width: `${result.score}%` }} />
              </div>
              {result.summary && (
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{result.summary}</p>
              )}
            </div>
          </div>

          {/* Keywords */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                Matched keywords ({result.matchedKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.matchedKeywords.length ? (
                  result.matchedKeywords.map((k) => (
                    <span key={k} className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                      {k}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">None detected.</span>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                Missing keywords ({result.missingKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.missingKeywords.length ? (
                  result.missingKeywords.map((k) => (
                    <span key={k} className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200">
                      {k}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Nothing major missing 🎉</span>
                )}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Suggestions</h4>
              <ul className="space-y-1.5">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-indigo-500 mt-0.5">→</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
