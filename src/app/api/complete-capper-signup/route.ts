import { NextResponse } from "next/server";
import { verifyJWT } from "@/utils/jwt";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/utils/bcrypt";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    const decoded = await verifyJWT(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const hashedPassword = await hashPassword(password);

    // Update user with password and set isCapper to true
    await prisma.user.update({
      where: { id: decoded.userId },
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
