"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const justRegistered = searchParams.get("registered") === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Pre-check the per-IP login rate so we can show a clear message
    // (NextAuth masks rate-limit errors as a generic "CredentialsSignin").
    try {
      const pre = await fetch("/api/auth/login-precheck", { method: "POST" });
      if (pre.status === 429) {
        const body = await pre.json().catch(() => ({}));
        setError(body.error || "Too many login attempts. Please wait a minute and try again.");
        setLoading(false);
        return;
      }
    } catch {
      /* if the pre-check is unreachable, fall through to the normal sign-in */
    }

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      if (res.error.includes("verify your email")) {
        setError(res.error + " You can request a new verification email if needed.");
      } else if (res.error === "CredentialsSignin") {
        setError("Incorrect email or password.");
      } else {
        setError(res.error);
      }
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">
          Sign In
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Welcome back. Sign in to continue.
        </p>

        {justRegistered && (
          <p className="text-emerald-600 text-sm text-center mb-4">
            Account created — please sign in.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            label="Email Address"
            autoComplete="email"
            required
          />

          <Input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            label="Password"
            autoComplete="current-password"
            required
          />

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <Button type="submit" variant="primary" className="w-full" glow disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <div className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center space-y-2">
          <p>
            No account?{" "}
            <a className="underline hover:text-indigo-600" href="/register">
              Create one
            </a>
          </p>
          <p>
            <a className="underline hover:text-indigo-600" href="/auth/forgot-password">
              Forgot password?
            </a>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
