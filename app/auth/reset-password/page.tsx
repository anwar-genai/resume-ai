"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid reset link. Please request a new password reset.");
    }
  }, [token, email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setMessage("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("form");
        setMessage(data.error || "Failed to reset password");
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
              Set New Password
            </h1>
            <p className="text-gray-600 text-center mb-6">
              Enter your new password below.
            </p>
            
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                label="New Password"
                required
              />
              
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                label="Confirm Password"
                required
              />
              
              {message && (
                <p className="text-red-600 text-sm text-center">{message}</p>
              )}
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  Password requirements:
                </p>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  <li>• At least 6 characters long</li>
                  <li>• Should be unique and hard to guess</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full"
                  glow
                >
                  Reset Password
                </Button>
                
                <Button 
                  type="button"
                  onClick={() => router.push("/login")}
                  variant="ghost"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </>
        )}

        {status === "loading" && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold mb-2">Resetting password...</h2>
            <p className="text-gray-600">Please wait while we update your password.</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <h2 className="text-lg font-semibold mb-2 text-green-600">Password Reset Successfully!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => router.push("/login")}
                className="w-full"
                glow
              >
                Sign In with New Password
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">✗</div>
            <h2 className="text-lg font-semibold mb-2 text-red-600">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => router.push("/auth/forgot-password")}
                className="w-full"
              >
                Request New Reset Link
              </Button>
              
              <Button 
                onClick={() => router.push("/login")}
                variant="ghost"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
