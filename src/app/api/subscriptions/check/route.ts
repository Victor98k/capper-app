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

    // At the start of the try block, after getting the payload
    console.log("Checking subscriptions for:", {
      authenticatedUserId: payload?.userId,
      requestedCapperId: capperId,
      requestedProductId: productId,
      tokenPresent: !!token,
    });

    // First, let's find any subscription regardless of status
    const allSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: payload.userId,
        capperId: capperId,
        ...(productId && { productId }),
      },
    });

    // Log ALL found subscriptions with full details
    console.log(
      "All found subscriptions (raw):",
      JSON.stringify(allSubscriptions, null, 2)
    );

    // Then check for active subscriptions with detailed logging
    console.log("Searching for active subscriptions with criteria:", {
      userId: payload.userId,
      capperId: capperId,
      status: "active",
      productIdFilter: productId ? { productId } : "none",
    });

    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: payload.userId,
        capperId: capperId,
        status: "active",
        ...(productId && { productId }),
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

    // Log the active subscriptions found
    console.log(
      "Active subscriptions found:",
      JSON.stringify(activeSubscriptions, null, 2)
    );

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

    // Add debug log for the current date
    console.log("Current date for comparison:", new Date().toISOString());

    return NextResponse.json({
      isSubscribed: activeSubscriptions.length > 0,
      subscribedProducts: activeSubscriptions.map((sub) => sub.productId),
      debug: {
        userId: payload.userId,
        capperId,
        productId,
        subscriptionsFound: activeSubscriptions.length,
        allSubscriptionsFound: allSubscriptions.length,
        activeSubscriptions: activeSubscriptions.map((sub) => ({
          id: sub.id,
          status: sub.status,
          subscribedAt: sub.subscribedAt,
          expiresAt: sub.expiresAt,
          cancelledAt: sub.cancelledAt,
          capperUsername: sub.capper.user.username,
        })),
      },
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json({ isSubscribed: false }, { status: 500 });
  }
}
