import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-57px)] flex items-center">
      <div className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">AI Resume & Cover Letter Generator</h1>
        <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg">Optimize your resume for ATS and generate tailored cover letters in seconds.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/resume" className="px-4 py-2 rounded bg-black/80 text-white text-center backdrop-blur-md hover:bg-black">Optimize Resume</Link>
          <Link href="/cover-letter" className="px-4 py-2 rounded border text-center bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md">Generate Cover Letter</Link>
          <Link href="/dashboard" className="px-4 py-2 rounded border text-center bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}
