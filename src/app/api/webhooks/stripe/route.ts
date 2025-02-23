import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    console.log("Webhook received - Starting processing");

    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret!);

    console.log("Webhook signature verified, event type:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("Checkout session completed. Session data:", {
        id: session.id,
        metadata: session.metadata,
        customer: session.customer,
        subscription: session.subscription,
      });

      try {
        // First check if subscription already exists
        const existingSubscription = await prisma.subscription.findFirst({
          where: {
            stripeSubscriptionId: session.subscription,
            userId: session.metadata.userId,
            capperId: session.metadata.capperId,
          },
        });

        if (existingSubscription) {
          console.log("Subscription already exists:", existingSubscription.id);
          return NextResponse.json({ received: true });
        }

        // Create new subscription
        const subscription = await prisma.subscription.create({
          data: {
            userId: session.metadata.userId,
            capperId: session.metadata.capperId,
            productId: session.metadata.productId,
            priceId: session.metadata.priceId,
            status: "active",
            stripeSubscriptionId: session.subscription,
            stripeCustomerId: session.customer,
            subscribedAt: new Date(),
            expiresAt:
              session.metadata.priceType === "recurring"
                ? null
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        console.log("Successfully created subscription in database:", {
          id: subscription.id,
          userId: subscription.userId,
          productId: subscription.productId,
        });

        // Update capper's subscriberIds
        await prisma.capper.update({
          where: { id: session.metadata.capperId },
          data: {
            subscriberIds: {
              push: session.metadata.userId,
            },
          },
        });

        console.log("Updated capper's subscriberIds");
      } catch (dbError) {
        console.error("Failed to create subscription in database:", dbError);
        // Log more details about the error
        console.error("Error details:", {
          message: dbError instanceof Error ? dbError.message : "Unknown error",
          code:
            dbError instanceof Error && "code" in dbError
              ? dbError.code
              : undefined,
          metadata: session.metadata,
        });
        throw dbError;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      type: event?.type,
      stack: error instanceof Error ? error.stack : undefined,
    });
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
