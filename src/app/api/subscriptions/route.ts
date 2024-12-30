import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function POST(req: Request) {
  try {
    // Get token from cookies
    const cookies = req.headers.get("cookie");
    console.log("All cookies in subscription route:", cookies);

    // Improved token extraction
    const cookiesArray =
      cookies?.split(";").map((cookie) => cookie.trim()) || [];
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );
    const token = tokenCookie?.split("=")[1];

    console.log(
      "Extracted token in subscription route:",
      token?.substring(0, 20) + "..."
    );

    if (!token) {
      console.log("No token found in cookies");
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Verify token and get userId
    try {
      const payload = await verifyJWT(token);
      console.log("JWT Payload in subscription:", payload);

      if (!payload?.userId) {
        console.log("Invalid token payload - no userId");
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized",
          },
          { status: 401 }
        );
      }

      const { capperId } = await req.json();
      console.log(
        "Subscribing userId:",
        payload.userId,
        "to capperId:",
        capperId
      );

      // Check if subscription already exists
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId: payload.userId,
          capperId: capperId,
          status: "active",
        },
      });

      if (existingSubscription) {
        console.log("Subscription already exists");
        return NextResponse.json({
          success: false,
          message: "Already subscribed",
        });
      }

      // Add subscriber to capper's subscriberIds
      const updatedCapper = await prisma.capper.update({
        where: { id: capperId },
        data: {
          subscriberIds: {
            push: payload.userId,
          },
        },
      });
      console.log("Updated capper:", updatedCapper);

      // Add subscription to user's subscriptions
      const subscription = await prisma.subscription.create({
        data: {
          userId: payload.userId,
          capperId: capperId,
          status: "active",
          subscribedAt: new Date(),
          productId: "",
          priceId: "",
          capper: {
            connect: {
              id: capperId,
            },
          },
        },
      });
      console.log("Created subscription:", subscription);

      return NextResponse.json({ success: true, subscription });
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal error",
        error: error.message,
      },
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

    const { capperId } = await req.json();

    // Get current subscriberIds
    const capper = await prisma.capper.findUnique({
      where: { id: capperId },
    });

    // Remove subscriber from capper's subscriberIds
    const updatedCapper = await prisma.capper.update({
      where: { id: capperId },
      data: {
        subscriberIds: {
          set:
            capper?.subscriberIds.filter((id) => id !== payload.userId) || [],
        },
      },
    });

    // Update subscription status
    const subscription = await prisma.subscription.updateMany({
      where: {
        userId: payload.userId,
        capperId: capperId,
        status: "active",
      },
      data: {
        status: "cancelled",
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
