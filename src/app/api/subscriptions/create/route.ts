import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { capperId, priceId } = await req.json();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const capper = await prisma.user.findUnique({
      where: { id: capperId },
    });

    if (!capper?.stripeConnectId) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    // Create subscription with Connect
    const subscription = await stripe.subscriptions.create({
      customer: session.user.stripeCustomerId, // You'll need to store this when user first pays
      items: [{ price: priceId }],
      application_fee_percent: 10, // Your platform fee
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
