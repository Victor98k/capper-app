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

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Get the raw request
    const text = await req.text();
    const headersList = await headers(); // await the headers
    const sig = headersList.get("stripe-signature");

    console.log("Raw webhook details:", {
      bodyLength: text.length,
      signatureHeader: sig?.substring(0, 20) + "...", // Log part of signature safely
      contentType: req.headers.get("content-type"),
    });

    if (!sig || !webhookSecret) {
      throw new Error(!sig ? "No signature found" : "No webhook secret found");
    }

    // Construct the event with the raw body
    const event = await stripe.webhooks.constructEventAsync(
      text,
      sig,
      webhookSecret
    );

    console.log("Webhook signature verified, event type:", event.type);

    console.log("Received webhook event:", {
      type: event.type,
      hasSession: !!event.data.object,
      hasMetadata: !!event.data.object.metadata,
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Detailed session logging
      console.log("Processing checkout.session.completed event:", {
        sessionId: session.id,
        timestamp: new Date().toISOString(),
        metadata: {
          userId: session.metadata?.userId,
          capperId: session.metadata?.capperId,
          productId: session.metadata?.productId,
          priceId: session.metadata?.priceId,
          priceType: session.metadata?.priceType,
        },
        customer: session.customer,
        subscription: session.subscription,
        paymentStatus: session.payment_status,
        mode: session.mode,
      });

      try {
        // Log subscription check
        console.log("Checking for existing subscription:", {
          stripeSubscriptionId: session.subscription,
          userId: session.metadata?.userId,
          capperId: session.metadata?.capperId,
        });

        const existingSubscription = await prisma.subscription.findFirst({
          where: {
            stripeSubscriptionId: session.subscription,
            userId: session.metadata.userId,
            capperId: session.metadata.capperId,
          },
        });

        if (existingSubscription) {
          console.log("Found existing subscription:", {
            subscriptionId: existingSubscription.id,
            status: existingSubscription.status,
            createdAt: existingSubscription.subscribedAt,
          });
          return NextResponse.json({ received: true });
        }

        // Log subscription creation attempt
        console.log("Attempting to create new subscription:", {
          userId: session.metadata.userId,
          capperId: session.metadata.capperId,
          productId: session.metadata.productId,
          timestamp: new Date().toISOString(),
        });

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

        console.log("Successfully created subscription:", {
          subscriptionId: subscription.id,
          userId: subscription.userId,
          capperId: subscription.capperId,
          productId: subscription.productId,
          status: subscription.status,
          createdAt: subscription.subscribedAt,
        });

        // Log capper update attempt
        console.log("Attempting to update capper's subscriberIds:", {
          capperId: session.metadata.capperId,
          newSubscriberId: session.metadata.userId,
        });

        await prisma.capper.update({
          where: { id: session.metadata.capperId },
          data: {
            subscriberIds: {
              push: session.metadata.userId,
            },
          },
        });

        console.log("Successfully updated capper's subscriberIds");

        return NextResponse.json({ received: true });
      } catch (dbError) {
        // Enhanced error logging
        console.error("Subscription creation failed:", {
          error: dbError instanceof Error ? dbError.message : "Unknown error",
          errorName: dbError instanceof Error ? dbError.name : "Unknown",
          stack: dbError instanceof Error ? dbError.stack : undefined,
          metadata: {
            userId: session.metadata?.userId,
            capperId: session.metadata?.capperId,
            productId: session.metadata?.productId,
            sessionId: session.id,
          },
          timestamp: new Date().toISOString(),
          prismaError:
            dbError instanceof Error && "code" in dbError
              ? {
                  code: (dbError as any).code,
                  meta: (dbError as any).meta,
                }
              : undefined,
        });
        throw dbError;
      }
    }

    return NextResponse.json({ received: true });
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
    externalResolver: true,
  },
};
