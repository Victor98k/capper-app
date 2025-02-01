import { NextResponse } from "next/server";
import { verifyJWT } from "@/utils/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const capperId = url.searchParams.get("capperId");
    const productId = url.searchParams.get("productId");

    if (!capperId) {
      return NextResponse.json({ error: "Missing capperId" }, { status: 400 });
    }

    // Get and verify token
    const cookies = req.headers.get("cookie");
    const token = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ isSubscribed: false });
    }

    const payload = await verifyJWT(token).catch(() => null);
    if (!payload?.userId) {
      return NextResponse.json({ isSubscribed: false });
    }

    // First, let's find any subscription regardless of status
    const allSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: payload.userId,
        capperId: capperId,
      },
    });

    console.log("All found subscriptions:", allSubscriptions);

    // Then check for active subscriptions
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: payload.userId,
        capperId: capperId,
        status: "active",
        ...(productId && { productId }), // Only include productId if provided
      },
    });

    console.log("Active subscriptions:", activeSubscriptions);

    // Log the exact query being used
    console.log("Query parameters:", {
      userId: payload.userId,
      capperId,
      productId,
      exactQuery: {
        userId: payload.userId,
        capperId: capperId,
        status: "active",
        ...(productId && { productId }),
      },
    });

    return NextResponse.json({
      isSubscribed: activeSubscriptions.length > 0,
      subscribedProducts: activeSubscriptions.map((sub) => sub.productId),
      debug: {
        userId: payload.userId,
        capperId,
        productId,
        subscriptionsFound: activeSubscriptions.length,
        allSubscriptionsFound: allSubscriptions.length,
      },
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json({ isSubscribed: false }, { status: 500 });
  }
}
