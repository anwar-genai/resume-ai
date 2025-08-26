"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      if (res.error.includes("verify your email")) {
        alert(res.error + " You can request a new verification email if needed.");
      } else {
        alert(res.error);
      }
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Sign In</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full p-3 border rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full p-3 border rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={loading} className="w-full py-2 bg-black text-white rounded">{loading ? "Signing in..." : "Sign In"}</button>
      </form>
      <div className="text-sm text-gray-600 mt-3 space-y-2">
        <p>No account? <a className="underline hover:text-indigo-600" href="/register">Register</a></p>
        <p><a className="underline hover:text-indigo-600" href="/auth/forgot-password">Forgot password?</a></p>
      </div>
    </div>
  );
}


