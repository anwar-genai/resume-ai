import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-57px)] flex items-center">
      <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">AI Resume & Cover Letter Generator</h1>
        <p className="text-gray-600 text-base sm:text-lg">Optimize your resume for ATS and generate tailored cover letters in seconds.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/resume" className="px-4 py-2 rounded bg-black text-white text-center">Optimize Resume</Link>
          <Link href="/cover-letter" className="px-4 py-2 rounded border text-center">Generate Cover Letter</Link>
          <Link href="/dashboard" className="px-4 py-2 rounded border text-center">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
