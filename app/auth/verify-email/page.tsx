"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "resend">("loading");
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    async function performVerification() {
      if (!token || !email) {
        setStatus("error");
        setMessage("Invalid verification link. Please check your email for the correct link.");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("Network error. Please try again.");
      }
    }

    performVerification();
  }, [token, email]);

  // Verification logic moved to useEffect

  async function resendVerification() {
    if (!email) return;
    
    setResending(true);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("resend");
        setMessage("New verification email sent! Please check your inbox.");
      } else {
        setMessage(data.error || "Failed to resend verification email");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <GlassCard className="p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold mb-2">Verifying your email...</h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <h1 className="text-xl font-semibold mb-2 text-green-600">Email Verified!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push("/login")}
                className="w-full"
                glow
              >
                Sign In Now
              </Button>
              <Button 
                onClick={() => router.push("/dashboard")}
                variant="secondary"
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-red-500 text-4xl mb-4">✗</div>
            <h1 className="text-xl font-semibold mb-2 text-red-600">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Button 
                onClick={resendVerification}
                disabled={resending || !email}
                className="w-full"
                variant="primary"
              >
                {resending ? "Sending..." : "Resend Verification Email"}
              </Button>
              <Button 
                onClick={() => router.push("/login")}
                variant="ghost"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </>
        )}

        {status === "resend" && (
          <>
            <div className="text-blue-500 text-4xl mb-4">📧</div>
            <h1 className="text-xl font-semibold mb-2 text-blue-600">Email Sent!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Button 
              onClick={() => router.push("/login")}
              variant="secondary"
              className="w-full"
            >
              Back to Login
            </Button>
          </>
        )}
      </GlassCard>
    </div>
  );
}
