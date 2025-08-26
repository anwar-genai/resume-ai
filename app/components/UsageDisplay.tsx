"use client";
import { useEffect, useState } from "react";
import GlassCard from "@/app/components/ui/GlassCard";

interface UsageData {
  resume: {
    remaining: number;
    periodEnd: string;
    canProceed: boolean;
  };
  cover: {
    remaining: number;
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

  const periodEnd = new Date(usage.resume.periodEnd);
  const daysUntilReset = Math.ceil((periodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <GlassCard className="p-4">
      <h3 className="font-semibold mb-3 text-gray-800">Usage This Month</h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Resumes</span>
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${usage.resume.remaining > 2 ? 'bg-green-500' : usage.resume.remaining > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.max(0, (usage.resume.remaining / 10) * 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {usage.resume.remaining} left
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Cover Letters</span>
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${usage.cover.remaining > 2 ? 'bg-green-500' : usage.cover.remaining > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.max(0, (usage.cover.remaining / 10) * 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {usage.cover.remaining} left
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
        </p>
      </div>
    </GlassCard>
  );
}
