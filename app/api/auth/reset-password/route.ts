import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";
import { verifyToken, consumeToken } from "@/lib/tokens";

export async function POST(request: Request) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password) {
      return NextResponse.json({ 
        error: "Token, email, and password are required" 
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        error: "Password must be at least 6 characters" 
      }, { status: 400 });
    }

    // Verify the token
    const isValidToken = await verifyToken(token, email, 'password_reset');
    
    if (!isValidToken) {
      return NextResponse.json({ 
        error: "Invalid or expired reset token" 
      }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
      },
    });

    // Consume the token (delete it)
    await consumeToken(token, email, 'password_reset');

    return NextResponse.json({ 
      message: "Password reset successfully",
      reset: true 
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ 
      error: "Failed to reset password" 
    }, { status: 500 });
  }
}
