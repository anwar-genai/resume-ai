"use client";
import { useEffect, useState } from "react";
import GlassCard from "@/app/components/ui/GlassCard";
import { PLANS } from "@/lib/plans";

interface Quota {
  remaining: number;
  remainingDaily: number;
  periodEnd: string;
  canProceed: boolean;
}

interface UsageData {
  plan: string;
  subscriptionStatus?: string | null;
  subscriptionEndsAt?: string | null;
  resume: Quota;
  cover: Quota;
  proposal: Quota;
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

  const plan = (usage.plan in PLANS ? usage.plan : "free") as keyof typeof PLANS;
  const isPaid = plan !== "free";
  const weeklyLimit = PLANS[plan].limits.weekly;
  const periodEnd = new Date(usage.resume.periodEnd);
  const daysUntilReset = Math.max(0, Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const row = (label: string, q: Quota) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${q.remaining > 2 ? 'bg-green-500' : q.remaining > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${Math.max(0, (q.remaining / weeklyLimit) * 100)}%` }}
          ></div>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {q.remaining} left
          <span className="text-xs text-gray-400"> · {q.remainingDaily} today</span>
        </span>
      </div>
    </div>
  );

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Usage This Week</h3>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPaid ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {PLANS[plan].name.toUpperCase()}
        </span>
      </div>

      <div className="space-y-3">
        {row('Resumes', usage.resume)}
        {row('Cover Letters', usage.cover)}
        {row('Proposals', usage.proposal)}
      </div>

      {isPaid && usage.subscriptionStatus === 'canceled' && usage.subscriptionEndsAt && (
        <p className="mt-3 text-xs text-amber-600">
          {PLANS[plan].name} ends on {new Date(usage.subscriptionEndsAt).toLocaleDateString()}.
          You keep full access until then, and can resume anytime before it.
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
        </p>
      </div>
    </GlassCard>
  );
}
