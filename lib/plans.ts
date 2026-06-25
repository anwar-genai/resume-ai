// Central plan configuration.
//
// Monthly limits are stored per-user on the User row (monthlyResumeLimit /
// monthlyCoverLimit) so admins can override them individually. The values here
// are what the Polar webhook applies when a user upgrades/downgrades.
//
// Daily limits are pure safety caps read straight from this config by plan —
// they exist to stop a single subscriber from running up the OpenAI bill.

export type PlanId = "free" | "pro";

export interface PlanLimits {
  monthlyResume: number;
  monthlyCover: number;
  dailyResume: number;
  dailyCover: number;
}

export const PLANS: Record<PlanId, PlanLimits> = {
  free: {
    monthlyResume: 10,
    monthlyCover: 10,
    // Free users are capped by the monthly limit anyway; daily mirrors it.
    dailyResume: 10,
    dailyCover: 10,
  },
  pro: {
    monthlyResume: 70,
    monthlyCover: 70,
    dailyResume: 10,
    dailyCover: 10,
  },
};

export function planLimits(plan: string | null | undefined): PlanLimits {
  return PLANS[(plan as PlanId) in PLANS ? (plan as PlanId) : "free"];
}
