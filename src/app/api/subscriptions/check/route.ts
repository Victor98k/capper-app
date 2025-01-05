import { NextResponse } from "next/server";
import { verifyJWT } from "@/utils/jwt";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const capperId = searchParams.get("capperId");
    const productId = searchParams.get("productId");

    // Get token from cookies
    const cookies = req.headers.get("cookie");
    const cookiesArray =
      cookies?.split(";").map((cookie) => cookie.trim()) || [];
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );
    const token = tokenCookie?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        {
          isSubscribed: false,
          error: "No authentication token found",
        },
        { status: 401 }
      );
    }

    // Verify token with better error handling
    let payload;
    try {
      payload = await verifyJWT(token);
      if (!payload?.userId) {
        return NextResponse.json(
          {
            isSubscribed: false,
            error: "Invalid token payload",
          },
          { status: 401 }
        );
      }
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json(
        {
          isSubscribed: false,
          error: "Token verification failed",
        },
        { status: 401 }
      );
    }

    // Add null check for capperId
    if (!capperId) {
      return NextResponse.json(
        {
          isSubscribed: false,
          error: "Capper ID is required",
        },
        { status: 400 }
      );
    }

    console.log("Checking subscription with params:", {
      userId: payload.userId,
      capperId,
      existingSubscription: await prisma.subscription.findFirst({
        where: {
          userId: payload.userId,
          capperId: capperId,
          status: "active",
        },
      }),
    });

    // Check database subscription
    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        userId: payload.userId,
        capperId: capperId,
        status: "active",
      },
      include: {
        capper: {
          include: {
            user: true,
          },
        },
      },
    });

    console.log("Raw database response:", dbSubscription);

    // If we have a database subscription, verify it with Stripe
    if (dbSubscription?.stripeSubscriptionId) {
      try {
        if (!dbSubscription?.capper?.user?.stripeConnectId) {
          console.error("No Stripe Connect ID found for capper");
          return NextResponse.json({
            isSubscribed: false,
            subscriptionDetails: null,
          });
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(
          dbSubscription.stripeSubscriptionId as string,
          {
            expand: ["customer"],
          },
          {
            stripeAccount: dbSubscription.capper.user.stripeConnectId,
          }
        );

        const isActive = stripeSubscription.status === "active";

        // If Stripe subscription is not active, update database
        if (!isActive) {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: { status: "inactive" },
          });
        }

        return NextResponse.json({
          isSubscribed: isActive,
          subscriptionDetails: {
            id: dbSubscription.id,
            status: isActive ? "active" : "inactive",
            createdAt: dbSubscription.subscribedAt,
            productId: dbSubscription.productId,
            stripeSubscriptionId: dbSubscription.stripeSubscriptionId,
          },
        });
      } catch (error) {
        console.error("Error verifying Stripe subscription:", error);
      }
    }

    // If no subscription found or verification failed
    return NextResponse.json({
      isSubscribed: false,
      subscriptionDetails: null,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      {
        isSubscribed: false,
        error: "Failed to check subscription status",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
