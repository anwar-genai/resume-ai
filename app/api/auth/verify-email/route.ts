import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyToken, consumeToken } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json({ 
        error: "Token and email are required" 
      }, { status: 400 });
    }

    // Verify the token
    const isValidToken = await verifyToken(token, email, 'email_verification');
    
    if (!isValidToken) {
      return NextResponse.json({ 
        error: "Invalid or expired verification token" 
      }, { status: 400 });
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
      // Consume the token even if already verified
      await consumeToken(token, email, 'email_verification');
      return NextResponse.json({ 
        message: "Email already verified",
        verified: true 
      });
    }

    // Update user's email verification status
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    });

    // Consume the token (delete it)
    await consumeToken(token, email, 'email_verification');

    return NextResponse.json({ 
      message: "Email verified successfully",
      verified: true 
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ 
      error: "Failed to verify email" 
    }, { status: 500 });
  }
}
