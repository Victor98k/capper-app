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

export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    // Expecting: game, amount, currency, odds, date
    const bet = await prisma.normalUserBet.create({
      data: {
        game: data.game,
        amount: parseFloat(data.amount),
        currency: data.currency,
        odds: parseFloat(data.odds),
        date: new Date(data.date),
        status: "PENDING",
        userId: user.userId,
      },
    });

    return NextResponse.json(bet);
  } catch (error) {
    console.error("Failed to add bet:", error);
    return NextResponse.json({ error: "Failed to add bet" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken();
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bets = await prisma.normalUserBet.findMany({
      where: {
        userId: user.userId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bets);
  } catch (error) {
    console.error("Failed to fetch bets:", error);
    return NextResponse.json(
      { error: "Failed to fetch bets" },
      { status: 500 }
    );
  }
}
