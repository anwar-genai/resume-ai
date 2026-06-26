"use client";
import { useEffect, useState } from "react";

// Shows a dismissable-free banner prompting unverified users to verify their
// email (only when the verification gate is on). Reads status from the usage
// endpoint so it doesn't add another round-trip on most pages.
export default function VerifyEmailBanner() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    let active = true;
    fetch("/api/user/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active || !d) return;
        if (d.verificationRequired && !d.emailVerified) {
          setShow(true);
          setEmail(d.email || "");
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!show) return null;

  async function resend() {
    setState("sending");
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-amber-800 dark:text-amber-200">
          <strong>Verify your email</strong> to start generating documents. Check your inbox for the link.
        </p>
        {state === "sent" ? (
          <span className="text-emerald-700 dark:text-emerald-300 font-medium">Verification email sent ✓</span>
        ) : (
          <button
            onClick={resend}
            disabled={state === "sending"}
            className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
          >
            {state === "sending" ? "Sending…" : "Resend email"}
          </button>
        )}
      </div>
      {state === "error" && (
        <p className="mt-1 text-xs text-red-600">Couldn&apos;t send the email. Please try again.</p>
      )}
    </div>
  );
}
