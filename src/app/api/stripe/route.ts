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

    console.log("Received request with:", { priceId, capperId, productId });

    // Get capper first
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

    if (!capper?.user?.stripeConnectId) {
      return NextResponse.json(
        { error: "Capper account information not found" },
        { status: 400 }
      );
    }

    // Then retrieve price with correct options
    let price;
    try {
      price = await stripe.prices.retrieve(
        priceId,
        { expand: ["product"] },
        { stripeAccount: capper.user.stripeConnectId }
      );
    } catch (priceError) {
      console.error("Price retrieval error:", priceError);
      return NextResponse.json(
        { error: "Invalid or inaccessible price" },
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

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.cappersports.co";

    // Create checkout session with different mode based on price type
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode:
        price.type === "recurring"
          ? ("subscription" as const)
          : ("payment" as const),
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: new URL(
        `/cappers/${encodeURIComponent(capper.user.username)}`,
        baseUrl
      ).toString(),
      cancel_url: new URL(
        `/cappers/${encodeURIComponent(capper.user.username)}`,
        baseUrl
      ).toString(),
      metadata: {
        userId: payload.userId,
        capperId: capperId,
        productId: productId,
        priceId: priceId,
        priceType: price.type,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig, {
      stripeAccount: capper.user.stripeConnectId,
    });

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
