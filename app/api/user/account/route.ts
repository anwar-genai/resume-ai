import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/db";

// DELETE /api/user/account
// Permanently deletes the signed-in user and all their data. Blocked while an
// auto-renewing subscription is active so we never delete an account that's
// still being billed — the user must cancel in the billing portal first.
export async function DELETE() {
  const session = await getAuthSession();
  const userId = (session as any)?.userId as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, subscriptionStatus: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.subscriptionStatus === "active") {
    return NextResponse.json(
      {
        error:
          "You have an active subscription. Please cancel it in the billing portal before deleting your account.",
        code: "subscription_active",
      },
      { status: 409 }
    );
  }

  // Resumes, cover letters, proposals, accounts and sessions cascade-delete with
  // the User row. Verification tokens are keyed by email, so remove them too.
  await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
