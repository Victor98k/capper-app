import { NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyJWT } from "@/utils/jwt";
import { PrismaClient } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
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
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token and get userId
    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      );
    }

    const { priceId, capperId, productId } = await req.json();
    console.log("Stripe checkout request:", { priceId, capperId, productId });

    if (!priceId || !capperId || !productId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get the capper's Stripe Connect ID and username
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
        { error: "Capper Stripe account not found" },
        { status: 400 }
      );
    }

    // Ensure we have the base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://cappers-app.vercel.app";

    // Create Stripe checkout session with the connected account
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${baseUrl}/cappers/${capper.user.username}`,
        cancel_url: `${baseUrl}/cappers/${capper.user.username}`,
        metadata: {
          userId: payload.userId,
          capperId: capperId,
          productId: productId,
        },
      },
      {
        stripeAccount: capper.user.stripeConnectId,
      }
    );

    console.log("Created checkout session:", {
      id: session.id,
      metadata: session.metadata,
      success_url: `${baseUrl}/cappers/${capper.user.username}`, // Log the URL for debugging
    });

    return NextResponse.json({
      sessionId: session.id,
      accountId: capper.user.stripeConnectId,
    });
  } catch (error) {
    console.error("Stripe API error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
