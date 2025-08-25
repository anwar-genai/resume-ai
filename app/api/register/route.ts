import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed } });
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


