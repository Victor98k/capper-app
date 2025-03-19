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

console.log("Webhook Configuration:", {
  environment: process.env.NODE_ENV,
  hasSecret: !!webhookSecret,
  secretPrefix: webhookSecret?.substring(0, 6),
  isProduction: process.env.NODE_ENV === "production",
});

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

// New logging function for Vercel
const vercelLog = (type: "info" | "error", message: string, data?: any) => {
  const logData = {
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };

  if (type === "error") {
    console.error("[Webhook Error]:", logData);
  } else {
    // Use console.log for Vercel production logs
    console.log("[Webhook]:", logData);
  }
};

// Add this temporarily to debug production
vercelLog("info", "Webhook configuration", {
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
vercelLog("info", "Webhook environment details", {
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

    vercelLog("info", "Webhook received", {
      NODE_ENV: process.env.NODE_ENV,
      hasWebhookSecret: !!webhookSecret,
      hasSignature: !!sig,
    });

    if (!sig || !webhookSecret) {
      vercelLog("error", "Webhook validation failed", {
        hasSignature: !!sig,
        hasSecret: !!webhookSecret,
      });
      return NextResponse.json(
        { error: !sig ? "No signature found" : "No webhook secret found" },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(text, sig, webhookSecret);
      vercelLog("info", "Stripe event constructed", {
        type: event.type,
        id: event.id,
        metadata: event.data.object.metadata,
      });
    } catch (err) {
      vercelLog("error", "Webhook signature verification failed", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed":
        // Only handle checkout.session.completed for subscriptions
        const session = event.data.object;
        if (session.mode === "subscription") {
          return await handleSubscriptionCreation(session);
        }
        return NextResponse.json({ received: true });

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        const subscription = event.data.object;
        return await handleSubscriptionUpdate(subscription);

      // Add these cases but just acknowledge them
      case "invoice.finalized":
      case "invoice.updated":
      case "invoice.paid":
      case "invoice.payment_succeeded":
        vercelLog("info", "Received event", {
          type: event.type,
          id: event.id,
          subscription: event.data.object.subscription,
        });
        return NextResponse.json({ received: true });

      default:
        vercelLog("info", "Unhandled event type", {
          type: event.type,
        });
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    vercelLog("error", "Webhook processing failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 400 }
    );
  }
}

async function handleSubscriptionCreation(session: any) {
  try {
    vercelLog("info", "Processing subscription creation", {
      sessionId: session.id,
      mode: session.mode,
      metadata: session.metadata,
      customerId: session.customer,
      subscriptionId: session.subscription,
    });

    if (!session.metadata?.userId || !session.metadata?.capperId) {
      vercelLog("error", "Missing required metadata", {
        metadata: session.metadata,
      });
      return NextResponse.json(
        { error: "Missing required metadata" },
        { status: 400 }
      );
    }

    const cacheKey = `subscription_${session.subscription}`;
    const cachedSubscription = getCachedData(cacheKey);

    if (cachedSubscription) {
      vercelLog("info", "Using cached subscription", {
        id: cachedSubscription.id,
      });
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
      vercelLog("info", "Cached existing subscription", {
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
    vercelLog("info", "Created and cached new subscription", {
      id: subscription.id,
    });

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
  } catch (error) {
    vercelLog("error", "Subscription creation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  try {
    // First check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        stripeSubscriptionId: subscription.id,
      },
    });

    if (!existingSubscription) {
      vercelLog("info", "No subscription found to update", {
        stripeSubscriptionId: subscription.id,
      });
      return NextResponse.json({ received: true });
    }

    // Then update it
    await prisma.subscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: subscription.status,
        cancelledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    vercelLog("error", "Subscription update error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
