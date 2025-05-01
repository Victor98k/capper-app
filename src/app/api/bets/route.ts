import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import cloudinary from "@/lib/cloudinary";

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
    const data = await request.json();
    let oddsScreenshotUrl = null;

    // Upload screenshot to Cloudinary if it exists
    if (data.oddsScreenshot) {
      try {
        const result = await cloudinary.uploader.upload(data.oddsScreenshot, {
          folder: "bet_validations",
        });
        oddsScreenshotUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Screenshot upload error:", uploadError);
      }
    }

    const betValidation = await prisma.bet.create({
      data: {
        game: data.game,
        amount: 0,
        odds: parseFloat(data.odds[0]),
        date: new Date(data.date),
        status: "PENDING",
        user: {
          connect: {
            id: data.userId,
          },
        },
        oddsScreenshot: oddsScreenshotUrl,
        oddsDate: new Date(data.date),
        post: {
          create: {
            title: data.game,
            content: data.game,
            bets: data.bets,
            odds: data.odds.map(String),
            bookmaker: data.bookmaker,
            capper: {
              connect: {
                userId: data.userId,
              },
            },
          },
        },
      },
      include: {
        user: true,
        post: true,
      },
    });

    return NextResponse.json(betValidation);
  } catch (error) {
    console.error("Failed to create bet validation:", error);
    return NextResponse.json(
      { error: "Failed to create bet validation" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all personal bets for the user
    const bets = await prisma.bet.findMany({
      where: {
        userId: user.userId,
        postId: null, // Only get personal bets
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        game: true,
        amount: true,
        currency: true,
        odds: true,
        date: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(bets);
  } catch (error) {
    console.error("[BETS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch bets" },
      { status: 500 }
    );
  }
}
