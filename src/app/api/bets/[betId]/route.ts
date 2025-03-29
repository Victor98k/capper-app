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

export async function PATCH(
  req: Request,
  context: { params: { betId: string } }
) {
  try {
    const user = await getUserFromToken();
    if (!user?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !["WON", "LOST"].includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    // Verify the bet belongs to the user
    const bet = await prisma.bet.findUnique({
      where: {
        id: context.params.betId,
      },
    });

    if (!bet || bet.userId !== user.userId) {
      return new NextResponse("Not found", { status: 404 });
    }

    const updatedBet = await prisma.bet.update({
      where: {
        id: context.params.betId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json(updatedBet);
  } catch (error) {
    console.error("[BET_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
