import { NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyJWT } from "@/utils/jwt";
import { PrismaClient } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { priceId, capperId, productId } = await req.json();

    // Get the capper's Stripe account ID and username
    const capper = await prisma.capper.findUnique({
      where: { id: capperId },
      include: {
        user: {
          select: {
            stripeConnectId: true,
            username: true,
          },
        },
      },
    });

    if (!capper?.user?.stripeConnectId || !capper?.user?.username) {
      return NextResponse.json(
        { error: "Capper account information not found" },
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

    // Get the base URL - add a fallback for production
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.cappersports.co";

    // Log the URL being constructed
    // console.log("Constructing URLs with base:", baseUrl);

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/cappers/${capper.user.username}`,
        cancel_url: `${baseUrl}/cappers/${capper.user.username}`,
        metadata: {
          userId: payload.userId,
          capperId: capperId,
          productId: productId,
          priceId: priceId,
          priceType: "recurring",
        },
      },
      {
        stripeAccount: capper.user.stripeConnectId,
      }
    );

    // Log the created session for debugging
    // console.log("Created checkout session:", {
    //   id: session.id,
    //   success_url: session.success_url,
    //   cancel_url: session.cancel_url,
    //   metadata: session.metadata,
    // });

    return NextResponse.json({
      sessionId: session.id,
      accountId: capper.user.stripeConnectId,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
