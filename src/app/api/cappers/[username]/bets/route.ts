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
          in: ["WON", "LOST"],
        },
      },
      orderBy: {
        date: "asc",
      },
      select: {
        status: true,
        date: true,
        units: true,
        odds: true,
        game: true,
      },
    });

    // Calculate individual bet results without accumulation
    const performanceData = verifiedBets.map((bet) => {
      const unitResult =
        bet.status === "WON" ? (bet.units || 0) * bet.odds : -(bet.units || 0);

      return {
        date: bet.date.toISOString().split("T")[0],
        units: unitResult,
        status: bet.status,
        unitChange: unitResult,
        odds: bet.odds,
        title: bet.game,
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
