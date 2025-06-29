import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getUserFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as {
      userId: string;
    };
    return decoded;
  } catch {
    return null;
  }
}

export async function PATCH(request: NextRequest, context: any) {
  const { params } = context; // Avoid explicit typing to satisfy build
  try {
    const user = await getUserFromToken();
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();

    const bet = await prisma.normalUserBet.update({
      where: { id: params.betId, userId: user.userId },
      data: { status },
    });

    return NextResponse.json(bet);
  } catch (error) {
    console.error("Failed to update bet:", error);
    return NextResponse.json(
      { error: "Failed to update bet" },
      { status: 500 }
    );
  }
}
