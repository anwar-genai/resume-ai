"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GlassCard from "@/app/components/ui/GlassCard";
import { PLANS, PlanId } from "@/lib/plans";

// Features shown per plan. Limits are pulled from PLANS so this never drifts.
function planPoints(id: PlanId): string[] {
  const l = PLANS[id].limits;
  return [
    `${l.weekly} resumes / week`,
    `${l.weekly} cover letters / week`,
    `${l.weekly} Upwork proposals / week`,
    id === "free" ? "Email support" : "Priority generation",
  ];
}

const ORDER: PlanId[] = ["free", "pro", "power"];

export default function PricingPage() {
  const [plan, setPlan] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/user/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        setAuthed(!!d);
        if (d?.plan) setPlan(d.plan);
      })
      .catch(() => active && setAuthed(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Simple, weekly plans</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Every plan includes resumes, cover letters and Upwork proposals. Cancel anytime.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {ORDER.map((id) => {
          const p = PLANS[id];
          const isCurrent = plan === id;
          const highlight = id === "pro";
          return (
            <GlassCard key={id} glow={highlight} className="p-6 flex flex-col">
              {highlight && (
                <span className="self-start mb-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white bg-gradient-to-r from-indigo-600 to-emerald-600">
                  Most popular
                </span>
              )}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{p.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{p.tagline}</p>

              <div className="mt-4 mb-5">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">${p.priceUsd}</span>
                <span className="text-gray-500 dark:text-gray-400">/mo</span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {planPoints(id).map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {point}
                  </li>
                ))}
              </ul>

              {renderCta(id, isCurrent, authed)}
            </GlassCard>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        Prices in USD. Billing handled securely by Polar. A daily safety cap applies to prevent abuse.
      </p>
    </div>
  );
}

function renderCta(id: PlanId, isCurrent: boolean, authed: boolean | null) {
  const base =
    "mt-auto inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition";

  if (isCurrent) {
    return (
      <span className={`${base} bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400 cursor-default`}>
        Current plan
      </span>
    );
  }

  if (id === "free") {
    return (
      <Link href={authed ? "/dashboard" : "/register"} className={`${base} border border-gray-300 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-800`}>
        {authed ? "Go to dashboard" : "Get started free"}
      </Link>
    );
  }

  // Paid plan. Signed-in users go straight to Polar checkout for that plan;
  // signed-out users sign up first.
  const href = authed ? `/api/checkout?plan=${id}` : "/register";
  return (
    <Link href={href} className={`${base} text-white bg-gradient-to-r from-indigo-600 to-emerald-600 hover:opacity-90 shadow-sm`}>
      Upgrade to {PLANS[id].name}
    </Link>
  );
}
