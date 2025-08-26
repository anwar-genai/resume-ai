"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "sent">("form");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email) {
      setMessage("Please enter your email address");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("sent");
        setMessage(data.message);
      } else {
        setStatus("form");
        setMessage(data.error || "Failed to send reset email");
      }
    } catch {
      setStatus("form");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-8 max-w-md w-full">
        {status === "form" && (
          <>
            <h1 className="text-2xl font-semibold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-emerald-500">
              Reset Password
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                label="Email Address"
                required
              />
              
              {message && (
                <p className="text-red-600 text-sm text-center">{message}</p>
              )}
              
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full"
                  glow
                >
                  Send Reset Link
                </Button>
                
                <Button 
                  type="button"
                  onClick={() => router.push("/login")}
                  variant="ghost"
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </>
        )}

        {status === "loading" && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold mb-2">Sending reset link...</h2>
            <p className="text-gray-600">Please wait while we send you the password reset email.</p>
          </div>
        )}

        {status === "sent" && (
          <div className="text-center">
            <div className="text-green-500 text-4xl mb-4">📧</div>
            <h2 className="text-lg font-semibold mb-2 text-green-600">Email Sent!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>What&apos;s next?</strong><br/>
                Check your email for a password reset link. The link will expire in 1 hour for security.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => router.push("/login")}
                className="w-full"
              >
                Back to Login
              </Button>
              
              <Button 
                onClick={() => setStatus("form")}
                variant="ghost"
                className="w-full"
              >
                Send Another Email
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
