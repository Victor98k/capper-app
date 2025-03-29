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

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();
    if (!user?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { game, amount, odds, date } = body;

    if (!game || !amount || !odds || !date) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const bet = await prisma.bet.create({
      data: {
        game,
        amount: parseFloat(amount),
        odds: parseFloat(odds),
        date: new Date(date),
        userId: user.userId,
      },
    });

    return NextResponse.json(bet);
  } catch (error) {
    console.error("[BETS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();
    if (!user?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const bets = await prisma.bet.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bets);
  } catch (error) {
    console.error("[BETS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
