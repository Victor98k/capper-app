import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function getUserFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as {
      userId: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const betId = url.pathname.split("/").pop(); // Extract betId from URL

    if (!betId) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !["WON", "LOST"].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    // Verify the bet belongs to the user
    const bet = await prisma.bet.findUnique({
      where: { id: betId },
    });

    if (!bet || bet.userId !== user.userId) {
      return new NextResponse("Not found", { status: 404 });
    }

    const updatedBet = await prisma.bet.update({
      where: { id: betId },
      data: { status },
    });

    return NextResponse.json(updatedBet);
  } catch (error) {
    console.error("[BET_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
