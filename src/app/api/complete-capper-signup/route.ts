import { NextResponse } from "next/server";
import { verifyJWT } from "@/utils/jwt";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/utils/bcrypt";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    console.log("Received token:", token);

    const payload = await verifyJWT(token);
    console.log("Token payload:", payload);

    if (!payload?.userId) {
      throw new Error("Invalid token");
    }

    // Log the user lookup
    const existingUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    console.log("Found user:", existingUser);

    const hashedPassword = await hashPassword(password);

    // Update user with password and set isCapper to true
    await prisma.user.update({
      where: { id: payload.userId },
      data: {
        password: hashedPassword,
        isCapper: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing capper signup:", error);
    return NextResponse.json(
      { error: "Failed to complete signup" },
      { status: 500 }
    );
  }
}
