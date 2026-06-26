import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";
import { checkRateLimit, getClientIp, registerLimiter } from "@/lib/ratelimit";
import { validatePassword } from "@/lib/password";
// Email verification disabled by request

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const ip = getClientIp(await headers());
    const rl = await checkRateLimit(registerLimiter, `register:${ip}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many sign-up attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const { email, password } = await request.json();
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    const pw = await validatePassword(password);
    if (!pw.ok) {
      return NextResponse.json({ error: pw.error }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Create user (email verification disabled)
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ 
      data: { 
        email, 
        password: hashed,
        emailVerified: null // Explicitly set as unverified
      } 
    });

    return NextResponse.json({ 
      id: user.id, 
      email: user.email, 
      message: "Account created!",
      emailSent: false 
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


