import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendVerificationEmail } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 });
    }

    await sendVerificationEmail(email);

    return NextResponse.json({
      message: "Verification email sent successfully",
      sent: true
    });

  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ 
      error: "Failed to send verification email" 
    }, { status: 500 });
  }
}
