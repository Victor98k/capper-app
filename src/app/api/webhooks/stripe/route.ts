import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

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

    console.log("Received webhook event:", event.type);

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
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session & {
        metadata: {
          userId: string;
          capperId: string;
          productId: string;
        };
      };

      // Retrieve the session with line items
      const expandedSession = (await stripe.checkout.sessions.retrieve(
        session.id,
        {
          expand: ["line_items"],
        }
      )) as Stripe.Checkout.Session & {
        line_items: {
          data: Array<{
            price: { id: string };
          }>;
        };
      };

      console.log("Processing completed checkout:", {
        metadata: session.metadata,
        subscription: session.subscription,
        lineItems: expandedSession.line_items,
      });

      try {
        const subscription = await prisma.subscription.create({
          data: {
            userId: session.metadata.userId,
            capperId: session.metadata.capperId,
            productId: session.metadata.productId,
            priceId: expandedSession.line_items.data[0].price.id,
            stripeSubscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : null,
            status: "active",
          },
        });
        console.log("Created subscription:", subscription);
      } catch (error) {
        console.error("Failed to create subscription:", error);
        throw error;
      }
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
