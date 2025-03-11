import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Add more detailed environment logging
console.log("Webhook environment check:", {
  hasWebhookSecretProductionUrl:
    !!process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL,
  webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL?.length,
  nodeEnv: process.env.NODE_ENV,
  // Don't log the actual secret, just check if it starts with 'whsec_'
  hasValidPrefix:
    process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL?.startsWith("whsec_"),
});

// Use a more descriptive variable name
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL;

if (!webhookSecret) {
  console.error(
    "Critical Error: Stripe webhook secret is not configured in environment variables",
    {
      nodeEnv: process.env.NODE_ENV,
      hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL,
    }
  );
}

// Add debug logging
console.log("Environment check:", {
  hasWebhookSecret: !!webhookSecret,
  environment: process.env.NODE_ENV,
  webhookSecretPrefix: webhookSecret?.substring(0, 8),
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
  try {
    // Add URL logging at the very start
    console.log("Incoming webhook request details:", {
      url: req.url,
      path: new URL(req.url).pathname,
      method: req.method,
    });

    const rawBody = await req.clone().arrayBuffer();
    const body = Buffer.from(rawBody).toString("utf8");
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");

    // Enhanced request validation logging
    console.log("Webhook request validation:", {
      hasSignature: !!sig,
      signaturePrefix: sig?.substring(0, 8),
      bodyLength: body.length,
      hasWebhookSecret: !!webhookSecret,
      rawBodyLength: rawBody.byteLength,
      headers: Object.fromEntries(headersList.entries()),
    });

    if (!sig || !webhookSecret) {
      const error = !sig
        ? "Missing Stripe signature"
        : "Missing webhook secret";
      console.error(`Webhook validation failed: ${error}`, {
        hasSignature: !!sig,
        hasWebhookSecret: !!webhookSecret,
        nodeEnv: process.env.NODE_ENV,
      });
      return NextResponse.json({ error }, { status: 400 });
    }

    let event;

    try {
      console.log("Webhook received - Starting processing");

      // Convert ArrayBuffer to Buffer for Stripe
      const rawBodyBuffer = Buffer.from(rawBody);
      event = stripe.webhooks.constructEvent(rawBodyBuffer, sig, webhookSecret);

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
            console.log(
              "Subscription already exists:",
              existingSubscription.id
            );
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
            message:
              dbError instanceof Error ? dbError.message : "Unknown error",
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
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 400 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
