import Link from "next/link";
import Button from "@/app/components/ui/Button";
import GlassCard from "@/app/components/ui/GlassCard";
import Badge from "@/app/components/ui/Badge";

const features = [
  {
    icon: "🤖",
    title: "AI-Powered Optimization",
    description: "Advanced algorithms analyze and enhance your resume for maximum impact",
    color: "from-indigo-500 to-blue-500",
  },
  {
    icon: "🎯",
    title: "ATS-Friendly Format",
    description: "Ensure your resume passes Applicant Tracking Systems with our optimized templates",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: "✨",
    title: "Personalized Content",
    description: "Generate tailored cover letters and proposals that match job requirements",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: "📈",
    title: "Real-time Analysis",
    description: "Get instant feedback on your documents with AI-driven insights",
    color: "from-orange-500 to-red-500",
  },
];

const stats = [
  { number: "10K+", label: "Resumes Created" },
  { number: "95%", label: "Success Rate" },
  { number: "500+", label: "Companies Reached" },
  { number: "4.9", label: "User Rating" },
];

export default function Home() {
  return (
    <main className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-24 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8 animate-fade-in">
            <Badge variant="info" size="md" className="mx-auto animate-bounce-slow">
              <span className="mr-1">🚀</span>
              AI-Powered Career Tools
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="block text-gray-900 dark:text-gray-100">Transform Your</span>
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 animate-float">
                Career Journey
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Create stunning resumes, compelling cover letters, and winning proposals with the power of artificial intelligence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/register">
                <Button variant="primary" size="lg" glow className="min-w-[200px] group">
                  Get Started Free
                  <svg 
                    className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" size="lg" className="min-w-[200px]">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Floating elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-16 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  {stat.number}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Everything You Need to <span className="bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">Succeed</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our AI-powered platform provides all the tools you need to create professional documents that get results.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <GlassCard className="p-6 h-full group" hover>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </GlassCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 bg-gradient-to-t from-gray-50/50 dark:from-zinc-900/50 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <GlassCard className="p-12" glow>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to <span className="bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">Level Up</span> Your Career?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their job search with our AI-powered tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button variant="primary" size="lg" glow className="min-w-[200px]">
                  Start Creating Now
                </Button>
              </Link>
              <Link href="/resume">
                <Button variant="ghost" size="lg" className="min-w-[200px]">
                  Try Resume Builder
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-6">
              No credit card required • Free tier available • Cancel anytime
            </p>
          </GlassCard>
        </div>
      </section>
    </main>
  );
}