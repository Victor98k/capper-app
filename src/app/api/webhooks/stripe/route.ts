import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") as string;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    if (event.type === "account.updated") {
      const account = event.data.object;

      await prisma.user.updateMany({
        where: { stripeConnectId: account.id },
        data: {
          stripeConnectOnboarded: account.details_submitted,
          payoutEnabled: account.payouts_enabled,
        },
      });
    } else if (event.type === "account.application.deauthorized") {
      const account = event.data.object;
      await prisma.user.updateMany({
        where: { stripeConnectId: account.id },
        data: {
          stripeConnectId: null,
          stripeConnectOnboarded: false,
          payoutEnabled: false,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
