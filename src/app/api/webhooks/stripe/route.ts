import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { log } from "console";

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

// Add runtime configuration
export const runtime = "nodejs";

// Update webhook secret selection
const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET ||
  (process.env.NODE_ENV === "development"
    ? process.env.STRIPE_WEBHOOK_SECRET_LOCAL
    : process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL);

// Add debug logging to see which secret is being used
console.log("Webhook environment check:", {
  NODE_ENV: process.env.NODE_ENV,
  hasMainSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
  hasProductionSecret: !!process.env.STRIPE_WEBHOOK_SECRET_PRODUCTION_URL,
  hasLocalSecret: !!process.env.STRIPE_WEBHOOK_SECRET_LOCAL,
  actualSecret: webhookSecret?.substring(0, 10) + "...", // Only log first 10 chars
  isDevelopment: process.env.NODE_ENV === "development",
});

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
// const log = (type: "info" | "error", message: string, data?: any) => {
//   const logData = {
//     message,
//     timestamp: new Date().toISOString(),
//     ...data,
//   };
//   console.log(`[Webhook ${type}]:`, logData);
// };

// Add this temporarily to debug production

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
// log("info", "Webhook environment details", {
//   nodeEnv: process.env.NODE_ENV,
//   webhookSecretType:
//     process.env.NODE_ENV === "development" ? "CLI" : "Dashboard",
//   hasWebhookSecret: !!webhookSecret,
//   webhookSecretPrefix: webhookSecret?.substring(0, 6),
// });

export async function GET(req: Request) {
  return NextResponse.json({ status: "Webhook endpoint is reachable" });
}

export async function POST(req: Request) {
  console.log("Webhook received - Starting webhook handler");
  try {
    const text = await req.text();
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");

    // Log all headers for debugging
    console.log("All webhook headers:", {
      headers: Object.fromEntries(headersList.entries()),
    });

    console.log("Webhook request debug:", {
      hasSignature: !!sig,
      signaturePrefix: sig?.substring(0, 10) + "...",
      hasWebhookSecret: !!webhookSecret,
      webhookSecretPrefix: webhookSecret?.substring(0, 10) + "...",
      environment: process.env.NODE_ENV,
      rawBody: text.substring(0, 200) + "...", // Log first 200 chars of the request body
      fullBody: text, // Log the full body for debugging
    });

    if (!sig || !webhookSecret) {
      console.error("Webhook validation failed:", {
        hasSignature: !!sig,
        hasSecret: !!webhookSecret,
        headers: Object.fromEntries(headersList.entries()),
      });
      return NextResponse.json(
        { error: !sig ? "No signature found" : "No webhook secret found" },
        { status: 400 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(text, sig, webhookSecret);
      console.log("Stripe event constructed:", {
        type: event.type,
        id: event.id,
        metadata: event.data.object.metadata,
        object: event.data.object,
        rawEvent: JSON.stringify(event, null, 2), // Log the entire event
      });
    } catch (err) {
      console.error("Webhook signature verification failed:", {
        error: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
        headers: Object.fromEntries(headersList.entries()),
        rawBody: text, // Log the raw body when verification fails
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
          lineItems: session.line_items,
        });

        // Log the complete session object for debugging
        console.log(
          "Complete session object:",
          JSON.stringify(session, null, 2)
        );

        // Log the product ID we're about to use
        console.log(
          "Using product ID from session metadata:",
          session.metadata.productId
        );

        // Verify the product exists in Stripe
        try {
          console.log("Attempting to retrieve product with:", {
            productId: session.metadata.productId,
            stripeAccountId: session.metadata.stripeAccountId,
            metadata: session.metadata,
            rawEvent: JSON.stringify(event.data.object, null, 2),
          });

          // First verify the Stripe account
          const account = await stripe.accounts.retrieve(
            session.metadata.stripeAccountId
          );
          console.log("Verified Stripe account:", {
            accountId: account.id,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
          });

          const product = await stripe.products.retrieve(
            session.metadata.productId,
            {
              stripeAccount: session.metadata.stripeAccountId,
            }
          );
          console.log("Verified product exists:", {
            productId: product.id,
            name: product.name,
            active: product.active,
            metadata: product.metadata,
          });

          // Check if the product is archived
          if (!product.active) {
            console.error("Product is archived:", {
              productId: product.id,
              name: product.name,
            });
            return NextResponse.json(
              { error: "Product is archived" },
              { status: 400 }
            );
          }
        } catch (error) {
          console.error("Error verifying product:", {
            error: error instanceof Error ? error.message : "Unknown error",
            productId: session.metadata.productId,
            stripeAccountId: session.metadata.stripeAccountId,
            metadata: session.metadata,
            rawEvent: JSON.stringify(event.data.object, null, 2),
          });
          return NextResponse.json(
            { error: "Failed to verify product" },
            { status: 400 }
          );
        }

        return await handleSubscriptionCreation(session);

      case "charge.succeeded":
        const charge = event.data.object;
        // console.log("Charge succeeded:", {
        //   id: charge.id,
        //   paymentIntent: charge.payment_intent,
        //   amount: charge.amount,
        //   metadata: charge.metadata,
        // });
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
        // console.log("Payment intent succeeded:", {
        //   id: event.data.object.id,
        //   amount: event.data.object.amount,
        //   metadata: event.data.object.metadata,
        // });
        return NextResponse.json({ received: true });

      default:
        console.log("Unhandled event type:", event.type);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error("Webhook processing error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreation(session: any) {
  try {
    console.log("Handling subscription creation with session:", {
      id: session.id,
      metadata: session.metadata,
      mode: session.mode,
      paymentStatus: session.payment_status,
      status: session.status,
      lineItems: session.line_items,
    });

    if (!session.metadata?.userId || !session.metadata?.capperId) {
      console.error("Missing required metadata:", session.metadata);
      return NextResponse.json(
        { error: "Missing required metadata" },
        { status: 400 }
      );
    }

    // Get capper's Stripe Connect ID
    const capper = await prisma.capper.findUnique({
      where: { id: session.metadata.capperId },
      include: {
        user: {
          select: {
            stripeConnectId: true,
          },
        },
      },
    });

    console.log("Retrieved capper:", {
      capperId: capper?.id,
      stripeConnectId: capper?.user?.stripeConnectId,
    });

    if (!capper?.user?.stripeConnectId) {
      console.error("Capper's Stripe Connect ID not found:", {
        capperId: session.metadata.capperId,
      });
      return NextResponse.json(
        { error: "Capper's Stripe account not found" },
        { status: 400 }
      );
    }

    // Log the product ID we're about to use
    console.log(
      "Using product ID from session metadata:",
      session.metadata.productId
    );

    // For one-time payments, use payment intent ID
    // For subscriptions, use subscription ID
    const identifier =
      session.mode === "subscription"
        ? session.subscription
        : session.payment_intent;

    console.log("Using identifier for subscription:", {
      identifier,
      mode: session.mode,
    });

    // Check for existing subscription
    try {
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
        console.log("Subscription already exists:", { identifier });
        return NextResponse.json({ received: true });
      }
    } catch (error) {
      console.error("Error checking for existing subscription:", {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: session.metadata.userId,
        capperId: session.metadata.capperId,
      });
      throw error;
    }

    // Create new subscription using the product ID from session metadata
    try {
      console.log("Creating new subscription with data:", {
        userId: session.metadata.userId,
        capperId: session.metadata.capperId,
        productId: session.metadata.productId,
        priceId: session.metadata.priceId,
        mode: session.mode,
        paymentIntent: session.payment_intent,
        customer: session.customer,
      });

      // First verify that both user and capper exist
      const [user, capper] = await Promise.all([
        prisma.user.findUnique({
          where: { id: session.metadata.userId },
        }),
        prisma.capper.findUnique({
          where: { id: session.metadata.capperId },
        }),
      ]);

      if (!user) {
        console.error("User not found:", { userId: session.metadata.userId });
        return NextResponse.json({ error: "User not found" }, { status: 400 });
      }

      if (!capper) {
        console.error("Capper not found:", {
          capperId: session.metadata.capperId,
        });
        return NextResponse.json(
          { error: "Capper not found" },
          { status: 400 }
        );
      }

      // Calculate expiration date
      const now = Date.now();
      let expiresAt: Date | null = null;

      if (session.mode === "payment") {
        switch (session.metadata?.interval) {
          case "week":
            expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000); // 1 week
            break;
          case "month":
            expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000); // 1 month
            break;
          case "year":
            expiresAt = new Date(now + 365 * 24 * 60 * 60 * 1000); // 1 year
            break;
          default:
            expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000); // Default to 30 days
        }
      } else if (session.metadata?.packageType !== "recurring") {
        switch (session.metadata?.interval) {
          case "week":
            expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000); // 1 week
            break;
          case "month":
            expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000); // 1 month
            break;
          case "year":
            expiresAt = new Date(now + 365 * 24 * 60 * 60 * 1000); // 1 year
            break;
          default:
            expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000); // Default to 30 days
        }
      }

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
          expiresAt,
        },
      });

      console.log("Subscription created successfully:", {
        id: subscription.id,
        productId: subscription.productId,
        userId: subscription.userId,
        capperId: subscription.capperId,
        expiresAt: subscription.expiresAt,
      });

      return NextResponse.json({ received: true });
    } catch (error) {
      console.error("Error creating subscription:", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        data: {
          userId: session.metadata.userId,
          capperId: session.metadata.capperId,
          productId: session.metadata.productId,
          priceId: session.metadata.priceId,
        },
      });
      throw error;
    }
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
