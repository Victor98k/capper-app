import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = headers();
  const sig = headersList.get("stripe-signature")!;

  try {
    const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    console.log("Received webhook event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Retrieve the session with line items
      const expandedSession = await stripe.checkout.sessions.retrieve(
        session.id,
        {
          expand: ["line_items"],
        }
      );

      console.log("Processing completed checkout:", {
        metadata: session.metadata,
        subscription: session.subscription,
        lineItems: expandedSession.line_items,
      });

      try {
        const subscription = await prisma.subscription.create({
          data: {
            userId: session.metadata!.userId,
            capperId: session.metadata!.capperId,
            productId: session.metadata!.productId,
            priceId: expandedSession.line_items!.data[0].price!.id,
            stripeSubscriptionId: session.subscription as string,
            status: "active",
          },
        });
        console.log("Created subscription:", subscription);
      } catch (error) {
        console.error("Failed to create subscription:", error);
        throw error;
      }
    }

    return new Response(JSON.stringify({ received: true }));
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response(
      JSON.stringify({ error: `Webhook Error: ${err.message}` }),
      { status: 400 }
    );
  }
}
