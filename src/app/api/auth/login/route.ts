import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePasswords } from "@/utils/bcrypt";
import { createToken } from "@/utils/jwt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Add timeout to database query
    const user = await Promise.race([
      prisma.user.findUnique({
        where: { email },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database timeout")), 10000)
      ),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passwordMatch = await comparePasswords(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = createToken(user);

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    if (error.message === "Database timeout") {
      return NextResponse.json(
        { error: "Database connection timeout. Please try again." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
