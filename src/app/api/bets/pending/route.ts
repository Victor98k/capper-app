import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function GET(req: Request) {
  try {
    // Verify super user status
    const cookies = req.headers.get("cookie");
    const token = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user and verify superuser status
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user?.isSuperUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, let's get the bets with minimal information to debug
    const simpleBets = await prisma.bet.findMany({
      where: {
        status: "PENDING",
        postId: {
          not: null,
        },
      },
      select: {
        id: true,
        userId: true,
        postId: true,
      },
    });

    console.log("Simple bets:", simpleBets);

    // Fetch pending bets with user and post information
    const pendingBets = await prisma.bet.findMany({
      where: {
        status: "PENDING",
        postId: {
          not: null,
        },
        userId: {
          in: await prisma.user
            .findMany()
            .then((users) => users.map((u) => u.id)),
        },
      },
      include: {
        user: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        post: {
          select: {
            title: true,
            bets: true,
            odds: true,
            units: true,
            bookmaker: true,
            capper: {
              select: {
                user: {
                  select: {
                    username: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Number of pending bets found:", pendingBets.length);

    // Log a sample bet to debug the structure
    if (pendingBets.length > 0) {
      console.log(
        "Sample bet structure:",
        JSON.stringify(pendingBets[0], null, 2)
      );
    }

    // Transform the data to include post information and handle null user
    const formattedBets = pendingBets
      .filter((bet) => bet.user !== null && bet.post !== null)
      .map((bet) => ({
        id: bet.id,
        game: bet.game,
        odds: bet.odds,
        units: bet.units,
        date: bet.date.toISOString(),
        status: bet.status,
        createdAt: bet.createdAt.toISOString(),
        updatedAt: bet.updatedAt.toISOString(),
        userId: bet.userId,
        oddsScreenshot: bet.oddsScreenshot,
        oddsDate: bet.oddsDate?.toISOString() || null,
        userInfo: bet.user
          ? {
              username: bet.user.username,
              firstName: bet.user.firstName,
              lastName: bet.user.lastName,
            }
          : null,
        postInfo: bet.post
          ? {
              title: bet.post.title,
              bets: bet.post.bets,
              odds: bet.post.odds,
              units: bet.post.units || 1,
              bookmaker: bet.post.bookmaker,
              capper: bet.post.capper?.user?.username || null,
            }
          : null,
      }));

    console.log("Number of formatted bets:", formattedBets.length);

    return NextResponse.json(formattedBets);
  } catch (error) {
    console.error("Error fetching pending bets:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending bets" },
      { status: 500 }
    );
  }
}
