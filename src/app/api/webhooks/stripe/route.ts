import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Comment out environment logging
/*
console.log("Webhook environment check:", {
  hasWebhookSecretProductionUrl:
    !!process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL,
  webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL?.length,
  nodeEnv: process.env.NODE_ENV,
  hasValidPrefix:
    process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL?.startsWith("whsec_"),
});
*/

// Use a more descriptive variable name
const webhookSecret =
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_WEBHOOK_SECRET_LOCAL
    : process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL;

if (!webhookSecret) {
  /*
  console.error(
    "Critical Error: Stripe webhook secret is not configured in environment variables",
    {
      nodeEnv: process.env.NODE_ENV,
      hasSecret: !!process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL,
    }
  );
  */
}

// Add debug logging
/*
console.log("Environment check:", {
  hasWebhookSecret: !!webhookSecret,
  environment: process.env.NODE_ENV,
  webhookSecretPrefix: webhookSecret?.substring(0, 8),
});
*/

const logWebhookError = (error: any, context: string) => {
  /*
  console.error(`[Webhook Error - ${context}]:`, {
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
  */
};

// Disable edge runtime for local testing
// export const runtime = "edge";

// Helper function for production logging
const log = (message: string, data: any) => {
  if (process.env.NODE_ENV === "production") {
    // Use Vercel's logging system
    console.warn(`[Webhook] ${message}`, data); // console.warn is visible in Vercel logs
  } else {
    console.log(`[Webhook] ${message}`, data);
  }
};

// Add this temporarily to debug production
log("Webhook configuration", {
  isDev: process.env.NODE_ENV === "development",
  hasProductionSecret: !!process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL,
  hasLocalSecret: !!process.env.STRIPE_WEBHOOK_SECRET_LOCAL,
  secretPrefix: webhookSecret?.substring(0, 6),
});

// Cache setup
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// At the top of your webhook handler
log("Webhook environment details", {
  nodeEnv: process.env.NODE_ENV,
  webhookSecretType:
    process.env.NODE_ENV === "development" ? "CLI" : "Dashboard",
  hasWebhookSecret: !!webhookSecret,
  webhookSecretPrefix: webhookSecret?.substring(0, 6),
});

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");

    // Log raw request details
    log("Incoming webhook request", {
      hasBody: !!text,
      bodyLength: text.length,
      signature: sig?.substring(0, 10),
      headers: Object.fromEntries(headersList.entries()),
    });

    log("Request received", {
      hasBody: !!text,
      bodyLength: text.length,
      hasSignature: !!sig,
      hasWebhookSecret: !!webhookSecret,
      nodeEnv: process.env.NODE_ENV,
    });

    if (!sig || !webhookSecret) {
      log("Validation failed", {
        hasSignature: !!sig,
        hasSecret: !!webhookSecret,
      });
      return NextResponse.json(
        { error: !sig ? "No signature found" : "No webhook secret found" },
        { status: 400 }
      );
    }

    try {
      const event = await stripe.webhooks.constructEventAsync(
        text,
        sig,
        webhookSecret
      );

      log("Event constructed", { type: event.type });

      if (
        event.type === "checkout.session.completed" ||
        event.type === "invoice.payment_succeeded"
      ) {
        const session = event.data.object;
        log("Processing payment event", {
          type: event.type,
          sessionId: session.id,
          hasMetadata: !!session.metadata,
          subscription: session.subscription,
        });

        try {
          // Check cache first
          const cacheKey = `subscription_${session.subscription}`;
          const cachedSubscription = getCachedData(cacheKey);

          if (cachedSubscription) {
            log("Using cached subscription", { id: cachedSubscription.id });
            return NextResponse.json({ received: true });
          }

          // Check database if not in cache
          const existingSubscription = await prisma.subscription.findFirst({
            where: {
              stripeSubscriptionId: session.subscription,
            },
          });

          if (existingSubscription) {
            // Cache the found subscription
            setCachedData(cacheKey, existingSubscription);
            log("Cached existing subscription", {
              id: existingSubscription.id,
            });
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

          // Cache the new subscription
          setCachedData(cacheKey, subscription);
          log("Created and cached new subscription", { id: subscription.id });

          // Update capper's subscribers
          await prisma.capper.update({
            where: { id: session.metadata.capperId },
            data: {
              subscriberIds: {
                push: session.metadata.userId,
              },
            },
          });

          return NextResponse.json({ received: true });
        } catch (dbError) {
          log("Database error", {
            error: dbError instanceof Error ? dbError.message : "Unknown error",
            metadata: session.metadata,
          });
          throw dbError;
        }
      }

      return NextResponse.json({ received: true });
    } catch (err) {
      log("Error", {
        message: err instanceof Error ? err.message : "Unknown error",
        type: err instanceof Error ? err.name : "Unknown",
      });
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Webhook processing failed:", error);
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
