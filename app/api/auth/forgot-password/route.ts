import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import { sendEmail, generatePasswordResetEmailTemplate } from "@/lib/email";
import { generateToken, getBaseUrl } from "@/lib/tokens";
import { checkRateLimit, getClientIp, forgotPasswordLimiter } from "@/lib/ratelimit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(await headers());
    const rl = await checkRateLimit(forgotPasswordLimiter, `forgot:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ 
        message: "If an account with that email exists, we've sent a password reset link",
        sent: true 
      });
    }

    // Generate password reset token
    const token = await generateToken(email, 'password_reset');
    
    // Build the reset URL from a TRUSTED base only. Using the request Host
    // header here would let an attacker forge it and receive a victim's reset
    // token via a poisoned link (host-header injection → account takeover).
    const baseUrl = getBaseUrl();
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send password reset email
    const emailTemplate = generatePasswordResetEmailTemplate(resetUrl, email);
    await sendEmail({
      to: email,
      ...emailTemplate,
    });

    return NextResponse.json({ 
      message: "If an account with that email exists, we've sent a password reset link",
      sent: true 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ 
      error: "Failed to send password reset email" 
    }, { status: 500 });
  }
}
