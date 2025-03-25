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

// At the top of the file
const log = (type: "info" | "error", message: string, data?: any) => {
  const logData = {
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };
  console.log(`[Webhook ${type}]:`, logData);
};

// Add this temporarily to debug production
log("info", "Webhook configuration", {
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
log("info", "Webhook environment details", {
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

    log("info", "Webhook received", {
      NODE_ENV: process.env.NODE_ENV,
      hasWebhookSecret: !!webhookSecret,
      hasSignature: !!sig,
    });

    if (!sig || !webhookSecret) {
      log("error", "Webhook validation failed", {
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
      log("info", "Stripe event constructed", {
        type: event.type,
        id: event.id,
        metadata: event.data.object.metadata,
      });
    } catch (err) {
      log("error", "Webhook signature verification failed", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;
        console.log("Checkout Session Data:", {
          id: session.id,
          mode: session.mode,
          paymentStatus: session.payment_status,
          metadata: session.metadata,
          customer: session.customer,
          paymentIntent: session.payment_intent,
          subscription: session.subscription,
        });
        return await handleSubscriptionCreation(session);

      case "charge.succeeded":
        const charge = event.data.object;
        console.log("Charge succeeded:", {
          id: charge.id,
          paymentIntent: charge.payment_intent,
          amount: charge.amount,
          metadata: charge.metadata,
        });
        // For one-time payments, we might want to handle this
        if (charge.metadata?.userId && charge.metadata?.capperId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            charge.payment_intent as string,
            { stripeAccount: charge.metadata.stripeAccount }
          );
          return await handleSubscriptionCreation({
            mode: "payment",
            metadata: charge.metadata,
            payment_intent: charge.payment_intent,
            customer: charge.customer,
          });
        }
        return NextResponse.json({ received: true });

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        const subscription = event.data.object;
        return await handleSubscriptionUpdate(subscription);

      case "payment_intent.succeeded":
        console.log("Payment intent succeeded:", {
          id: event.data.object.id,
          amount: event.data.object.amount,
          metadata: event.data.object.metadata,
        });
        return NextResponse.json({ received: true });

      default:
        console.log("Unhandled event type:", event.type);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    log("error", "Webhook processing failed", {
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
    console.log("Creating subscription for:", {
      userId: session.metadata?.userId,
      capperId: session.metadata?.capperId,
      mode: session.mode,
      paymentIntent: session.payment_intent,
      subscription: session.subscription,
    });

    if (!session.metadata?.userId || !session.metadata?.capperId) {
      log("error", "Missing required metadata", {
        metadata: session.metadata,
      });
      return NextResponse.json(
        { error: "Missing required metadata" },
        { status: 400 }
      );
    }

    // For one-time payments, use payment intent ID
    // For subscriptions, use subscription ID
    const identifier =
      session.mode === "subscription"
        ? session.subscription
        : session.payment_intent;

    // Check for existing subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        OR: [
          { stripeSubscriptionId: identifier },
          { stripePaymentIntentId: identifier },
        ],
        userId: session.metadata.userId,
        capperId: session.metadata.capperId,
      },
    });

    if (existingSubscription) {
      log("info", "Subscription already exists", { identifier });
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
        stripeSubscriptionId:
          session.mode === "subscription" ? session.subscription : null,
        stripePaymentIntentId:
          session.mode === "payment" ? session.payment_intent : null,
        stripeCustomerId: session.customer,
        subscribedAt: new Date(),
        expiresAt:
          session.mode === "payment"
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : null,
      },
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

    console.log("Subscription created:", {
      id: subscription.id,
      userId: subscription.userId,
      capperId: subscription.capperId,
      status: subscription.status,
      paymentIntentId: subscription.stripePaymentIntentId,
      subscriptionId: subscription.stripeSubscriptionId,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Subscription creation error:", {
      error: error instanceof Error ? error.message : error,
      session: {
        id: session.id,
        mode: session.mode,
        metadata: session.metadata,
      },
    });
    throw error;
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
      log("info", "No subscription found to update", {
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
    log("error", "Subscription update error", {
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
