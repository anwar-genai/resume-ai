import prisma from "@/lib/db";
import { generateToken, getBaseUrl } from "@/lib/tokens";
import { sendEmail, generateVerificationEmailTemplate } from "@/lib/email";

// Email verification gate. Required by default; set REQUIRE_EMAIL_VERIFICATION=false
// (e.g. local dev where outbound email isn't set up) to disable the gate entirely.
export function emailVerificationRequired(): boolean {
  return process.env.REQUIRE_EMAIL_VERIFICATION !== "false";
}

/** True if the gate is off, or the user has a verified email. */
export async function isEmailVerified(userId: string): Promise<boolean> {
  if (!emailVerificationRequired()) return true;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  return Boolean(user?.emailVerified);
}

/** Generate a fresh verification token and email the verify link (trusted base URL). */
export async function sendVerificationEmail(email: string): Promise<void> {
  const token = await generateToken(email, "email_verification");
  const url = `${getBaseUrl()}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  await sendEmail({ to: email, ...generateVerificationEmailTemplate(url) });
}
