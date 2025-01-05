import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("Webhook: Processing checkout.session.completed", {
          session_id: session.id,
          metadata: session.metadata,
          subscription: session.subscription,
        });

        const metadata = session.metadata as {
          userId: string;
          capperId: string;
          productId: string;
          priceId: string;
        };

        // Log before creating subscription
        console.log("Creating subscription with data:", {
          userId: metadata.userId,
          capperId: metadata.capperId,
          productId: metadata.productId,
          priceId: metadata.priceId,
          stripeSubscriptionId: session.subscription,
        });

        // Create subscription record in database
        await prisma.subscription.create({
          data: {
            userId: metadata.userId,
            capperId: metadata.capperId,
            status: "active",
            subscribedAt: new Date(),
            productId: metadata.productId,
            priceId: metadata.priceId,
            stripeSubscriptionId: session.subscription as string,
          },
        });

        // Update capper's subscriberIds
        await prisma.capper.update({
          where: { id: metadata.capperId },
          data: {
            subscriberIds: {
              push: metadata.userId,
            },
          },
        });

        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = event.data.object;

        // Update subscription status in database
        await prisma.subscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            status: subscription.status === "active" ? "active" : "inactive",
          },
        });

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
