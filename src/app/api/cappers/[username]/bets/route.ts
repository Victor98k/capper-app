import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Extract username from URL - using same pattern as the main capper profile API
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const usernameIndex = segments.indexOf("cappers") + 1;
    const encodedUsername = segments[usernameIndex];
    const username = decodeURIComponent(encodedUsername);

    console.log("Looking for username:", username, "Encoded:", encodedUsername);

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Use the same query pattern as the main capper profile API
    const capper = await prisma.capper.findFirst({
      where: {
        user: {
          username,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    console.log(
      "Database query result:",
      capper ? "Found capper" : "No capper found"
    );

    if (!capper) {
      // Let's also try to find all usernames that are similar for debugging
      const similarUsers = await prisma.user.findMany({
        where: {
          username: {
            contains: username.split(" ")[0], // Search for first part of username
            mode: "insensitive",
          },
          capperProfile: {
            isNot: null,
          },
        },
        select: {
          username: true,
        },
      });

      console.log(
        "Similar usernames found:",
        similarUsers.map((u) => u.username)
      );

      return NextResponse.json(
        {
          error: "Capper not found",
          searchedFor: username,
          similarUsernames: similarUsers.map((u) => u.username),
        },
        { status: 404 }
      );
    }

    console.log(
      "Found capper:",
      capper.user.username,
      "User ID:",
      capper.user.id
    );

    // Get all verified bets directly by userId (since bets are linked to user, not through posts)
    const verifiedBets = await prisma.bet.findMany({
      where: {
        userId: capper.user.id, // Query directly by the user's ID
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

    console.log("Found bets:", verifiedBets.length);

    // Calculate cumulative performance data
    let cumulativeUnits = 0;
    const performanceData = verifiedBets.map((bet) => {
      const unitResult =
        bet.status === "WON"
          ? (bet.units || 0) * (bet.odds - 1) // Profit calculation: units * (odds - 1)
          : -(bet.units || 0); // Loss: negative units

      cumulativeUnits += unitResult;

      return {
        date: bet.date.toISOString().split("T")[0],
        title: bet.game || "Bet",
        units: Number(cumulativeUnits.toFixed(2)), // Cumulative units (rounded to 2 decimals)
        status: bet.status,
        unitChange: Number(unitResult.toFixed(2)), // Individual bet result
        originalUnits: bet.units,
        odds: bet.odds,
      };
    });

    // console.log("Performance data:", performanceData);

    return NextResponse.json(performanceData);
  } catch (error) {
    console.error("Error fetching capper bets:", error);
    return NextResponse.json(
      { error: "Failed to fetch capper bets" },
      { status: 500 }
    );
  }
}
