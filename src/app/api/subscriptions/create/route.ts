import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { verifyJWT } from "@/utils/jwt";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify token
    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { capperId, priceId } = await req.json();

    const capper = await prisma.user.findUnique({
      where: { id: capperId },
    });

    if (!capper?.stripeConnectId) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    // Create subscription with Connect
    const subscription = await stripe.subscriptions.create({
      customer: payload.userId, // You'll need to store this when user first pays
      items: [{ price: priceId }],
      application_fee_percent: 10,
      transfer_data: {
        destination: capper.stripeConnectId,
      },
    });

    return NextResponse.json({ subscriptionId: subscription.id });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Subscription creation failed" },
      { status: 500 }
    );
  }
}
