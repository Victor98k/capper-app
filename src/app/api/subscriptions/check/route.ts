import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";
import { stripe } from "@/lib/stripe";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const capperId = url.searchParams.get("capperId");
    const productId = url.searchParams.get("productId");

    if (!capperId) {
      return NextResponse.json(
        { error: "Capper ID is required" },
        { status: 400 }
      );
    }

    // Get user from token
    const cookies = request.headers.get("cookie");
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

    // Get capper's Stripe Connect ID
    const capper = await prisma.capper.findUnique({
      where: { id: capperId },
      include: {
        user: {
          select: {
            stripeConnectId: true,
          },
        },
      },
    });

    if (!capper?.user?.stripeConnectId) {
      return NextResponse.json(
        { error: "Capper's Stripe account not found" },
        { status: 404 }
      );
    }

    // If a product ID is provided, verify it exists in Stripe first
    if (productId) {
      try {
        const product = await stripe.products.retrieve(productId, {
          stripeAccount: capper.user.stripeConnectId,
        });

        if (!product.active) {
          return NextResponse.json(
            { error: "Product is not active" },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error("Error verifying product:", {
          error: error instanceof Error ? error.message : "Unknown error",
          productId,
          stripeAccountId: capper.user.stripeConnectId,
        });
        return NextResponse.json(
          { error: "Product not found or inaccessible" },
          { status: 404 }
        );
      }
    }

    // Check for active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: payload.userId,
        capperId: capperId,
        ...(productId && { productId }),
        status: "active",
        OR: [
          { expiresAt: null }, // Recurring subscriptions
          { expiresAt: { gt: new Date() } }, // One-time subscriptions that haven't expired
        ],
      },
    });

    // Extract product IDs from active subscriptions
    const subscribedProducts = activeSubscriptions.map((sub) => sub.productId);

    console.log("Subscription check details:", {
      userId: payload.userId,
      capperId,
      productId,
      activeCount: activeSubscriptions.length,
      subscribedProducts,
    });

    return NextResponse.json({
      isSubscribed: activeSubscriptions.length > 0,
      subscriptions: activeSubscriptions,
      subscribedProducts: subscribedProducts,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}
