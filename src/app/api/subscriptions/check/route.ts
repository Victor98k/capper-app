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

    console.log("Subscription check request check w capper id wrong?:", {
      capperId,
      productId,
    });

    if (!capperId) {
      return NextResponse.json({ error: "Missing capperId" }, { status: 400 });
    }

    // First verify the capper exists
    const capper = await prisma.capper.findUnique({
      where: {
        id: capperId,
      },
      include: {
        user: true,
      },
    });

    // Push to later deploy.

    if (!capper) {
      console.log("Capper not found:", capperId);
      return NextResponse.json({
        isSubscribed: false,
        error: "Capper not found",
      });
    }

    // get cookies
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

    // Check for specific product subscription if productId is provided
    const subscriptionQuery = {
      where: {
        userId: payload.userId,
        capperId: capper.id,
        status: "active",
        ...(productId && { productId }), // Only include productId in query if it's provided
        OR: [
          { stripeSubscriptionId: { not: null } },
          {
            AND: [
              { stripeSubscriptionId: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        ],
      },
    };

    const subscriptions = await prisma.subscription.findMany(subscriptionQuery);

    // Get all subscribed products for this capper
    const allSubscribedProducts = await prisma.subscription.findMany({
      where: {
        userId: payload.userId,
        capperId: capper.id,
        status: "active",
      },
      select: {
        productId: true,
      },
    });

    return NextResponse.json({
      isSubscribed: subscriptions.length > 0,
      subscribedProducts: allSubscribedProducts.map((sub) => sub.productId),
      debug: {
        userId: payload.userId,
        requestedProduct: productId,
        subscriptionCount: subscriptions.length,
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
