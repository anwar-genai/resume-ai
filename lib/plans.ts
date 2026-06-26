// Central plan configuration — the single source of truth for tiers & limits.
//
// Limits are PLAN-DRIVEN (read straight from here by `user.plan`), not stored
// per-user. Each document type (resume / cover letter / proposal) gets its own
// independent allowance.
//
// Two windows are enforced together (see lib/usage.ts):
//   - weekly: the headline allowance, resets every 7 days.
//   - daily:  a pure safety cap so a single subscriber can't run up the OpenAI
//             bill in one sitting.
//
// API cost on gpt-4o-mini is ~$0.001–0.0015 per generation, so even the Power
// tier's worst case (~$1.4/user/mo) leaves a wide margin on a $5–12 sub. The
// limits are therefore positioning/abuse guards, not cost controls.

export type PlanId = "free" | "pro" | "power";
export type DocType = "resume" | "cover" | "proposal";

export interface PlanLimits {
  weekly: number; // per document type, per 7-day period
  daily: number; // per document type, per calendar day (safety cap)
}

export interface Plan {
  id: PlanId;
  name: string;
  /** Monthly price in USD. 0 for the free tier. */
  priceUsd: number;
  /** Short marketing line for the pricing UI. */
  tagline: string;
  limits: PlanLimits;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceUsd: 0,
    tagline: "Try it out",
    limits: { weekly: 3, daily: 3 },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceUsd: 5,
    tagline: "For active job seekers",
    limits: { weekly: 25, daily: 10 },
  },
  power: {
    id: "power",
    name: "Power",
    priceUsd: 12,
    tagline: "For freelancers running many proposals",
    limits: { weekly: 100, daily: 25 },
  },
};

/** Length of a usage period, in days. Weekly for every plan. */
export const PERIOD_DAYS = 7;

export function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "pro" || value === "power";
}

/** Resolve a plan's limits, falling back to Free for unknown/null values. */
export function planLimits(plan: string | null | undefined): PlanLimits {
  return (isPlanId(plan) ? PLANS[plan] : PLANS.free).limits;
}

/** Paid plans only, in display order — handy for the pricing UI. */
export const PAID_PLANS: Plan[] = [PLANS.pro, PLANS.power];
