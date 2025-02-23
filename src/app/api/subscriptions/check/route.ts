import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const capperId = url.searchParams.get("capperId");
    const productId = url.searchParams.get("productId");

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

    // Check for active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: payload.userId,
        capperId: capperId!,
        ...(productId && { productId }),
        status: "active",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    // Extract product IDs from active subscriptions
    const subscribedProducts = activeSubscriptions.map((sub) => sub.productId);

    console.log("Subscription check details:", {
      userId: payload.userId,
      capperId,
      productId,
      activeCount: activeSubscriptions.length,
      totalCount: activeSubscriptions.length,
      currentTime: new Date().toISOString(),
      activeSubscriptions,
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
