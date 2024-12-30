import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function GET(req: Request) {
  try {
    // Get token from cookies
    const cookies = req.headers.get("cookie");
    console.log("Cookies:", cookies);

    if (!cookies) {
      return NextResponse.json({
        isSubscribed: false,
        message: "No cookies found",
      });
    }

    const cookiesArray = cookies.split(";").map((cookie) => cookie.trim());
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );
    const token = tokenCookie?.split("=")[1];

    if (!token) {
      return NextResponse.json({
        isSubscribed: false,
        message: "No token found",
      });
    }

    // Get capperId and productId from query params
    const { searchParams } = new URL(req.url);
    const capperId = searchParams.get("capperId");
    const productId = searchParams.get("productId");

    console.log("Query params:", { capperId, productId });

    if (!capperId) {
      return NextResponse.json({
        isSubscribed: false,
        error: "Capper ID is required",
      });
    }

    // Verify token and get userId
    const payload = await verifyJWT(token);
    console.log("JWT payload:", payload);

    if (!payload || !payload.userId) {
      return NextResponse.json({
        isSubscribed: false,
        message: "Invalid token",
      });
    }

    // Check if subscription exists
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: payload.userId,
        capperId,
        status: "active",
        ...(productId ? { productId } : {}),
      },
      select: {
        id: true,
        status: true,
        subscribedAt: true,
        productId: true,
        priceId: true,
        stripeSubscriptionId: true,
      },
    });

    console.log("Found subscription:", subscription);

    return NextResponse.json({
      isSubscribed: !!subscription,
      subscriptionDetails: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            createdAt: subscription.subscribedAt,
            productId: subscription.productId,
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json({
      isSubscribed: false,
      error: "Failed to check subscription status",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
