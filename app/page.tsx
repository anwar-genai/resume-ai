import Link from "next/link";
import Button from "@/app/components/ui/Button";
import GlassCard from "@/app/components/ui/GlassCard";

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-57px)] flex items-center">
      <div className="max-w-4xl mx-auto p-6 sm:p-8">
        <GlassCard className="p-8 sm:p-12 text-center" glow>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 mb-6">
            AI Resume & Cover Letter Generator
          </h1>
          <p className="text-gray-700 dark:text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Transform your career with AI-powered resume optimization and personalized cover letters that get you noticed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/resume">
              <Button variant="primary" size="lg" glow>
                ✨ Optimize Resume
              </Button>
            </Link>
            <Link href="/cover-letter">
              <Button variant="secondary" size="lg">
                📝 Generate Cover Letter
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="lg">
                📊 Dashboard
              </Button>
            </Link>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
