import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { verifyJWT } from "@/utils/jwt";

export async function POST(req: Request) {
  try {
    const { capperId, productId, priceId } = await req.json();

    if (!capperId || !productId || !priceId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user from token
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

    // Check for existing active subscription for this product
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: payload.userId,
        capperId: capperId,
        productId: productId,
        status: "active",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (existingSubscription) {
      return NextResponse.json({
        success: false,
        message: "Already subscribed to this bundle",
      });
    }

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: payload.userId,
        capperId: capperId,
        productId: productId,
        priceId: priceId,
        status: "active",
        subscribedAt: new Date(),
        // Set expiresAt based on your subscription duration logic
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days example
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const cookies = req.headers.get("cookie");
    const cookiesArray =
      cookies?.split(";").map((cookie) => cookie.trim()) || [];
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );
    const token = tokenCookie?.split("=")[1];

    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { capperId, productId } = await req.json();

    // Find the active subscription in our database
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: payload.userId,
        capperId: capperId,
        ...(productId && { productId }), // Only include productId if provided
        status: "active",
      },
      include: {
        capper: {
          include: {
            user: {
              select: {
                stripeConnectId: true,
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // If it's a Stripe subscription, cancel it in Stripe
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(
          subscription.stripeSubscriptionId,
          undefined,
          {
            stripeAccount:
              subscription.capper.user.stripeConnectId || undefined,
          }
        );
      } catch (stripeError) {
        console.error("Stripe cancellation error:", stripeError);
        return NextResponse.json(
          { error: "Failed to cancel Stripe subscription" },
          { status: 500 }
        );
      }
    }

    // Get current subscriberIds
    const capper = await prisma.capper.findUnique({
      where: { id: capperId },
    });

    // Update our database
    await prisma.$transaction([
      // Remove subscriber from capper's subscriberIds
      prisma.capper.update({
        where: { id: capperId },
        data: {
          subscriberIds: {
            set:
              capper?.subscriberIds.filter((id) => id !== payload.userId) || [],
          },
        },
      }),
      // Update subscription status
      prisma.subscription.updateMany({
        where: {
          userId: payload.userId,
          capperId: capperId,
          ...(productId && { productId }), // Only include productId if provided
          status: "active",
        },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
