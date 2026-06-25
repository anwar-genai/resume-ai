import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { polar, POLAR_PRODUCT_ID } from "@/lib/polar";

// GET /api/checkout
// Creates a Polar checkout session for the Pro subscription and redirects the
// signed-in user to Polar's hosted checkout page.
export async function GET() {
  const session = await getAuthSession();
  const userId = (session as any)?.userId as string | undefined;
  const email = session?.user?.email as string | undefined;

  if (!userId || !email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!POLAR_PRODUCT_ID) {
    return NextResponse.json({ error: "POLAR_PRODUCT_ID is not configured" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  try {
    const checkout = await polar.checkouts.create({
      products: [POLAR_PRODUCT_ID],
      successUrl: `${appUrl}/dashboard?upgraded=1`,
      // Link the Polar customer to our user so the webhook can map back.
      externalCustomerId: userId,
      customerEmail: email,
      metadata: { userId },
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
