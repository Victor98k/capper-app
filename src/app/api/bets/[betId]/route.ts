import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const betId = url.pathname.split("/").pop(); // or use regex to extract [betId]
    const { status } = await req.json();

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user?.isSuperUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedBet = await prisma.bet.update({
      where: { id: betId },
      data: { status },
    });

    return NextResponse.json(updatedBet);
  } catch (error) {
    console.error("Error updating bet:", error);
    return NextResponse.json(
      { error: "Failed to update bet" },
      { status: 500 }
    );
  }
}
