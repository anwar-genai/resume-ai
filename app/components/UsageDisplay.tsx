"use client";
import { useEffect, useState } from "react";
import GlassCard from "@/app/components/ui/GlassCard";
import { PLANS } from "@/lib/plans";

interface UsageData {
  plan: string;
  subscriptionStatus?: string | null;
  subscriptionEndsAt?: string | null;
  resume: {
    remaining: number;
    remainingDaily: number;
    periodEnd: string;
    canProceed: boolean;
  };
  cover: {
    remaining: number;
    remainingDaily: number;
    periodEnd: string;
    canProceed: boolean;
  };
  isBlocked: boolean;
  blockReason?: string;
}

export default function UsageDisplay() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  async function fetchUsage() {
    try {
      const res = await fetch('/api/user/usage');
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      } else {
        // If not authenticated or other error, silently handle
        console.log('Usage fetch failed:', res.status);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <GlassCard className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </GlassCard>
    );
  }

  if (!usage) {
    // Don't show anything if no usage data (e.g., not authenticated)
    return null;
  }

  if (usage.isBlocked) {
    return (
      <GlassCard className="p-4 border-red-200 bg-red-50">
        <div className="text-red-600">
          <h3 className="font-semibold mb-1">Account Blocked</h3>
          <p className="text-sm">{usage.blockReason}</p>
        </div>
      </GlassCard>
    );
  }

  const isPro = usage.plan === "pro";
  const limits = PLANS[isPro ? "pro" : "free"];
  const periodEnd = new Date(usage.resume.periodEnd);
  const daysUntilReset = Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const row = (label: string, remaining: number, remainingDaily: number, monthlyTotal: number) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${remaining > 2 ? 'bg-green-500' : remaining > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.max(0, (remaining / monthlyTotal) * 100)}%` }}
          ></div>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {remaining} left
          <span className="text-xs text-gray-400"> · {remainingDaily} today</span>
        </span>
      </div>
    </div>
  );

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Usage This Month</h3>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPro ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isPro ? 'PRO' : 'FREE'}
        </span>
      </div>

      <div className="space-y-3">
        {row('Resumes', usage.resume.remaining, usage.resume.remainingDaily, limits.monthlyResume)}
        {row('Cover Letters', usage.cover.remaining, usage.cover.remainingDaily, limits.monthlyCover)}
      </div>

      {isPro && usage.subscriptionStatus === 'canceled' && usage.subscriptionEndsAt && (
        <p className="mt-3 text-xs text-amber-600">
          Pro ends on {new Date(usage.subscriptionEndsAt).toLocaleDateString()}. You can
          resume anytime before then.
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
        </p>
        {isPro ? (
          <a
            href="/api/portal"
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-2"
          >
            Manage Subscription
          </a>
        ) : (
          <a
            href="/api/checkout"
            className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full transition-colors"
          >
            Upgrade to Pro
          </a>
        )}
      </div>
    </GlassCard>
  );
}
