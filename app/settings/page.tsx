"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import GlassCard from "@/app/components/ui/GlassCard";
import Button from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

export default function SettingsPage() {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function onDelete() {
    setError("");
    setDeleting(true);
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to delete account.");
        setDeleting(false);
        return;
      }
      // Account is gone — clear the session and leave.
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Network error. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Account Settings</h1>

      {/* Data export */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Your data</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Download a copy of your account and all your resumes, cover letters, and proposals as JSON.
        </p>
        <a href="/api/user/export" download>
          <Button variant="secondary">Export my data</Button>
        </a>
      </GlassCard>

      {/* Danger zone */}
      <GlassCard className="p-6 border-red-300/50">
        <h2 className="text-lg font-semibold text-red-600 mb-1">Delete account</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Permanently delete your account and all your documents. This cannot be undone. If you have
          an active subscription, cancel it in the billing portal first.
        </p>

        <div className="space-y-3">
          <Input
            label='Type DELETE to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <Button
            variant="danger"
            onClick={onDelete}
            disabled={confirmText !== "DELETE" || deleting}
          >
            {deleting ? "Deleting…" : "Delete my account"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
