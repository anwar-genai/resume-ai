"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      // Sign the new user straight in — no need to re-enter credentials.
      const signInRes = await signIn("credentials", { email, password, redirect: false });
      if (signInRes?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        // Account exists but auto sign-in failed; send them to the login page.
        router.push("/login?registered=1");
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">
          Create Account
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Start optimizing resumes, cover letters, and proposals.
        </p>

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
            placeholder="At least 8 characters"
            label="Password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <Button type="submit" variant="primary" className="w-full" glow disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </Button>
        </form>

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
          Already have an account?{" "}
          <a className="underline hover:text-indigo-600" href="/login">
            Sign in
          </a>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 text-center">
          By creating an account you agree to our{" "}
          <a className="underline hover:text-indigo-600" href="/privacy">
            Privacy Policy
          </a>
          .
        </p>
      </GlassCard>
    </div>
  );
}
