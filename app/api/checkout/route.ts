import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { polar, productIdForPlan } from "@/lib/polar";
import { isPlanId } from "@/lib/plans";

// GET /api/checkout?plan=pro|power
// Creates a Polar checkout session for the chosen paid plan and redirects the
// signed-in user to Polar's hosted checkout page. Defaults to Pro.
export async function GET(request: Request) {
  const session = await getAuthSession();
  const userId = (session as any)?.userId as string | undefined;
  const email = session?.user?.email as string | undefined;

  if (!userId || !email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const planParam = new URL(request.url).searchParams.get("plan") ?? "pro";
  const plan = isPlanId(planParam) && planParam !== "free" ? planParam : "pro";
  const productId = productIdForPlan(plan);

  if (!productId) {
    return NextResponse.json(
      { error: `No Polar product configured for plan "${plan}"` },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${appUrl}/dashboard?upgraded=1`,
      // Link the Polar customer to our user so the webhook can map back.
      externalCustomerId: userId,
      customerEmail: email,
      metadata: { userId, plan },
    });

    return NextResponse.redirect(checkout.url, { status: 303 });
  } catch (error: any) {
    console.error("Polar checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout", detail: error?.message ?? "" },
      { status: 500 }
    );
  }
}
