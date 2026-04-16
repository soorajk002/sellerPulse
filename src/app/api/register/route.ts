import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);

    // Surface a helpful message for common DB issues
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("table")) {
      return NextResponse.json(
        { error: "Database tables not found. Run: npx prisma db push" },
        { status: 500 }
      );
    }
    if (msg.includes("connect") || msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
      return NextResponse.json(
        { error: "Cannot connect to database. Check DATABASE_URL in Vercel env vars." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
