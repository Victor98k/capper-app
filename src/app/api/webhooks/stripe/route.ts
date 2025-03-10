import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Add more detailed environment logging
console.log("Available environment variables:", {
  hasWebhookSecretLive: !!process.env.STRIPE_WEBHOOK_SECRET_LIVE,
  webhookSecretLiveValue:
    process.env.STRIPE_WEBHOOK_SECRET_LIVE?.substring(0, 5) + "...",
  nodeEnv: process.env.NODE_ENV,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_LIVE;

if (!endpointSecret) {
  console.error("WARNING: Webhook secret is not configured!");
}

// Add debug logging
console.log("Environment check:", {
  hasWebhookSecret: !!endpointSecret,
  environment: process.env.NODE_ENV,
  webhookSecretPrefix: endpointSecret?.substring(0, 8),
});

const logWebhookError = (error: any, context: string) => {
  console.error(`[Webhook Error - ${context}]:`, {
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
};

export async function POST(req: Request) {
  // Get the raw body as a Buffer to preserve exact formatting
  const chunks = [];
  const reader = req.body?.getReader();
  if (!reader) {
    return NextResponse.json({ error: "No request body" }, { status: 400 });
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const body = Buffer.concat(chunks).toString("utf8");
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  // Add debug logging for request
  console.log("Webhook request details:", {
    hasSignature: !!sig,
    signaturePrefix: sig?.substring(0, 8),
    bodyLength: body.length,
  });

  if (!sig || !endpointSecret) {
    console.error("Missing stripe signature or webhook secret", {
      hasSignature: !!sig,
      hasEndpointSecret: !!endpointSecret,
    });
    return NextResponse.json(
      { error: "Missing stripe signature or webhook secret" },
      { status: 400 }
    );
  }

  let event;

  try {
    console.log("Webhook received - Starting processing");

    // Use endpointSecret (STRIPE_WEBHOOK_SECRET_LIVE) consistently
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);

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

        return NextResponse.json({ received: true });
      } catch (dbError) {
        logWebhookError(dbError, "Database Operation");
        console.error("Failed to create subscription in database:", dbError);
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
