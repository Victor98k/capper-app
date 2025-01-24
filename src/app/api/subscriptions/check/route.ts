import { NextResponse } from "next/server";
import { verifyJWT } from "@/utils/jwt";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const capperId = url.searchParams.get("capperId");
    const productId = url.searchParams.get("productId");

    console.log("Request params:", { capperId, productId });

    if (!capperId) {
      return NextResponse.json({ error: "Missing capperId" }, { status: 400 });
    }

    // First verify the capper exists and get their details
    const capper = await prisma.capper.findUnique({
      where: { id: capperId },
      include: {
        user: {
          select: {
            username: true,
            id: true,
          },
        },
      },
    });

    if (!capper) {
      console.log("Capper not found:", capperId);
      return NextResponse.json({
        isSubscribed: false,
        error: "Capper not found",
      });
    }

    const cookies = req.headers.get("cookie");
    const token = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({
        isSubscribed: false,
        error: "No authentication token",
      });
    }

    let payload;
    try {
      payload = await verifyJWT(token);
    } catch (jwtError) {
      return NextResponse.json({
        isSubscribed: false,
        error: "Token verification failed",
      });
    }

    if (!payload || !payload.userId) {
      return NextResponse.json({
        isSubscribed: false,
        error: "Invalid authentication",
      });
    }

    // First get all user's active subscriptions
    const allSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: payload.userId,
        status: "active",
      },
      include: {
        capper: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    console.log("All user subscriptions:", {
      requestedCapperId: capperId,
      requestedCapperUsername: capper.user.username,
      activeSubscriptions: allSubscriptions.map((sub) => ({
        capperId: sub.capperId,
        capperUsername: sub.capper.user.username,
      })),
    });

    // Then check for specific capper subscription
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: payload.userId,
        capperId: capper.id,
        status: "active",
      },
    });

    return NextResponse.json({
      isSubscribed: subscriptions.length > 0,
      subscribedProducts: subscriptions.map((sub) => sub.productId),
      debug: {
        userId: payload.userId,
        requestedCapper: {
          id: capper.id,
          username: capper.user.username,
        },
        activeSubscriptions: allSubscriptions.map((sub) => ({
          capperId: sub.capperId,
          username: sub.capper.user.username,
        })),
      },
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json(
      {
        isSubscribed: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
