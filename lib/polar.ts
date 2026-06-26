import { Polar } from "@polar-sh/sdk";
import { PlanId, isPlanId } from "@/lib/plans";

// POLAR_SERVER controls which Polar environment we hit.
// Use "sandbox" for local development/testing, "production" once you go live.
const server = (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server,
});

// One Polar product per paid plan. Set these to the product ids from the SAME
// Polar org/environment as POLAR_ACCESS_TOKEN.
//
// Back-compat: the original single-product var `POLAR_PRODUCT_ID` is still
// honoured as the Pro product if `POLAR_PRODUCT_ID_PRO` isn't set.
const PRODUCT_IDS: Record<Exclude<PlanId, "free">, string> = {
  pro: process.env.POLAR_PRODUCT_ID_PRO || process.env.POLAR_PRODUCT_ID || "",
  power: process.env.POLAR_PRODUCT_ID_POWER || "",
};

// Kept for back-compat with existing imports.
export const POLAR_PRODUCT_ID = PRODUCT_IDS.pro;

/** Polar product id to use at checkout for a given paid plan ("" if unset). */
export function productIdForPlan(plan: PlanId): string {
  if (plan === "free") return "";
  return PRODUCT_IDS[plan] ?? "";
}

/**
 * Map a Polar product id back to our internal plan id. Used by the webhook to
 * decide which plan a purchase grants. Falls back to "pro" so a mis-set env var
 * never silently downgrades a paying customer.
 */
export function planForProductId(productId: string | null | undefined): PlanId {
  if (productId) {
    for (const [plan, id] of Object.entries(PRODUCT_IDS)) {
      if (id && id === productId && isPlanId(plan)) return plan;
    }
  }
  return "pro";
}

/** Pull the product id off a Polar order/subscription webhook payload. */
export function productIdFromEvent(obj: any): string | null {
  return (
    obj?.productId ??
    obj?.product?.id ??
    obj?.items?.[0]?.productId ??
    obj?.items?.[0]?.product?.id ??
    null
  );
}
