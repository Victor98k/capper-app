import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Extract username from URL
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const usernameIndex = segments.indexOf("cappers") + 1;
    const username = segments[usernameIndex];

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Get capper by username
    const capper = await prisma.user.findUnique({
      where: { username },
      include: {
        capperProfile: true,
      },
    });

    if (!capper?.capperProfile) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    // Get all verified bets from their posts
    const verifiedBets = await prisma.bet.findMany({
      where: {
        post: {
          capperId: capper.capperProfile.id,
        },
        status: {
          not: "PENDING",
        },
      },
      orderBy: {
        date: "asc",
      },
      select: {
        status: true,
        date: true,
        odds: true,
        amount: true,
      },
    });

    // Calculate cumulative performance
    let cumulativeProfit = 0;
    const performanceData = verifiedBets.map((bet) => {
      const profit =
        bet.status === "WON"
          ? (bet.amount || 0) * (bet.odds - 1)
          : -(bet.amount || 0);
      cumulativeProfit += profit;

      return {
        date: bet.date.toISOString().split("T")[0],
        profit: cumulativeProfit,
        status: bet.status,
      };
    });

    return NextResponse.json(performanceData);
  } catch (error) {
    console.error("Error fetching capper bets:", error);
    return NextResponse.json(
      { error: "Failed to fetch capper bets" },
      { status: 500 }
    );
  }
}
