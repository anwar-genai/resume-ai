import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { polar } from "@/lib/polar";

// GET /api/portal
// Creates a Polar customer-portal session for the signed-in user and redirects
// them to it, where they can manage/cancel their subscription and update cards.
export async function GET() {
  const session = await getAuthSession();
  const userId = (session as any)?.userId as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const customerSession = await polar.customerSessions.create({
      externalCustomerId: userId,
    });

    return NextResponse.redirect(customerSession.customerPortalUrl, { status: 303 });
  } catch (error: any) {
    console.error("Polar portal error:", error);
    return NextResponse.json(
      { error: "Failed to open customer portal", detail: error?.message ?? "" },
      { status: 500 }
    );
  }
}
