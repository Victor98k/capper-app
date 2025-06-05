import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Prisma, BetStatus } from "@prisma/client";

type BetWithStatus = {
  status: BetStatus;
  units: number | null;
  odds: number;
};

interface Post {
  bets: BetWithStatus[];
}

interface CapperWithRelations {
  id: string;
  userId: string;
  bio: string | null;
  tags: string[];
  profileImage: string | null;
  imageUrl: string | null;
  socialLinks: Prisma.JsonValue;
  posts: {
    bets: {
      status: string;
      units: number;
      odds: number;
    }[];
  }[];
  user: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    imageUrl: string | null;
  };
}

// Helper function to calculate winrate and ROI
const calculateStats = (bets: BetWithStatus[]) => {
  const completedBets = bets.filter(
    (bet) => bet.status === "WON" || bet.status === "LOST"
  );

  const wonBets = completedBets.filter((bet) => bet.status === "WON").length;
  const totalBets = completedBets.length;
  const winrate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

  // Calculate ROI
  const totalInvestment = completedBets.reduce(
    (acc, bet) => acc + (bet.units || 1),
    0
  );
  const totalReturns = completedBets.reduce((acc, bet) => {
    if (bet.status === "WON") {
      return acc + (bet.units || 1) * bet.odds;
    }
    return acc;
  }, 0);

  const roi =
    totalInvestment > 0
      ? ((totalReturns - totalInvestment) / totalInvestment) * 100
      : 0;

  return {
    winrate,
    totalBets,
    roi,
  };
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    // If email is provided, check if user is a capper
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          isCapper: true,
        },
      });

      return NextResponse.json({
        isCapper: Boolean(user?.isCapper),
      });
    }

    // Get all cappers with their associated user info and bets
    const cappers = await prisma.capper.findMany({
      where: {
        user: {
          id: { not: undefined },
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            imageUrl: true,
          },
        },
        posts: {
          include: {
            capperBets: true,
          },
        },
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!cappers) {
      return NextResponse.json([]);
    }

    // Map the data to match the expected Capper type in the frontend
    const formattedCappers = cappers.map((capper) => {
      // Flatten bets array from posts
      const allBets =
        capper.posts?.flatMap((post) =>
          post.capperBets.map((bet) => ({
            status: bet.status,
            units: bet.units,
            odds: bet.odds,
          }))
        ) || [];

      const stats = calculateStats(allBets);

      return {
        id: capper.id,
        userId: capper.userId,
        bio: capper.bio,
        user: {
          firstName: capper.user.firstName,
          lastName: capper.user.lastName,
          username: capper.user.username,
        },
        profileImage: capper.profileImage,
        imageUrl: capper.imageUrl || undefined,
        tags: capper.tags || [],
        socialLinks: capper.socialLinks || {},
        stats: {
          winrate: stats.winrate,
          totalBets: stats.totalBets,
        },
        roi: capper.roi || 0,
      };
    });

    return NextResponse.json(formattedCappers);
  } catch (error) {
    console.error("Error in cappers route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bio } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updatedCapper = await prisma.capper.update({
      where: { userId: userId },
      data: { bio },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Error updating capper profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tagToRemove } = body;

    if (!userId || !tagToRemove) {
      return NextResponse.json(
        { error: "User ID and tag are required" },
        { status: 400 }
      );
    }

    const capper = await prisma.capper.findUnique({
      where: { userId },
      select: { tags: true },
    });

    if (!capper) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    const updatedTags = capper.tags.filter((tag) => tag !== tagToRemove);

    const updatedCapper = await prisma.capper.update({
      where: { userId },
      data: { tags: updatedTags },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Error removing tag:", error);
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tags } = body;

    if (!userId || !tags?.length) {
      return NextResponse.json(
        { error: "User ID and tags are required" },
        { status: 400 }
      );
    }

    const capper = await prisma.capper.findUnique({
      where: { userId },
      select: { tags: true },
    });

    if (!capper) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    const updatedTags = [...new Set([...capper.tags, ...tags])];

    const updatedCapper = await prisma.capper.update({
      where: { userId },
      data: { tags: updatedTags },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Error adding tags:", error);
    return NextResponse.json({ error: "Failed to add tags" }, { status: 500 });
  }
}
