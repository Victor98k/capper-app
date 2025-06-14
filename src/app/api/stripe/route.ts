import { NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyJWT } from "@/utils/jwt";
import { PrismaClient } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { priceId, capperId, productId } = await req.json();

    console.log("Received request with:", { priceId, capperId, productId });

    // Get capper first
    const capper = await prisma.capper.findUnique({
      where: { id: capperId },
      include: {
        user: {
          select: {
            stripeConnectId: true,
            username: true,
          },
        },
      },
    });

    if (!capper?.user?.stripeConnectId) {
      return NextResponse.json(
        { error: "Capper account information not found" },
        { status: 400 }
      );
    }

    // Then retrieve price with correct options
    let price;
    try {
      price = await stripe.prices.retrieve(
        priceId,
        { expand: ["product"] },
        { stripeAccount: capper.user.stripeConnectId }
      );
      console.log("Retrieved price:", {
        priceId: price.id,
        requestedProductId: productId,
        priceProductId: (price.product as Stripe.Product).id,
        metadata: (price.product as Stripe.Product).metadata,
      });

      // Verify that the price belongs to the requested product
      if ((price.product as Stripe.Product).id !== productId) {
        console.error("Price product ID mismatch:", {
          requestedProductId: productId,
          priceProductId: (price.product as Stripe.Product).id,
        });
        return NextResponse.json(
          { error: "Price does not belong to the requested product" },
          { status: 400 }
        );
      }

      // Verify that the price is active
      if (!price.active) {
        console.error("Price is not active:", {
          priceId: price.id,
          productId: productId,
        });
        return NextResponse.json(
          { error: "Price is not active" },
          { status: 400 }
        );
      }
    } catch (priceError) {
      console.error("Price retrieval error:", {
        error:
          priceError instanceof Error ? priceError.message : "Unknown error",
        priceId,
        stripeAccountId: capper.user.stripeConnectId,
      });
      return NextResponse.json(
        { error: "Invalid or inaccessible price" },
        { status: 400 }
      );
    }

    // Get the product to access its metadata
    let product;
    try {
      product = await stripe.products.retrieve(productId, {
        stripeAccount: capper.user.stripeConnectId,
      });
      console.log("Retrieved product:", {
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

      // Get the default price for this product
      const prices = await stripe.prices.list(
        {
          product: productId,
          active: true,
          limit: 1,
        },
        {
          stripeAccount: capper.user.stripeConnectId,
        }
      );

      if (prices.data.length === 0) {
        console.error("No active prices found for product:", {
          productId,
          name: product.name,
        });
        return NextResponse.json(
          { error: "No active prices found for this product" },
          { status: 400 }
        );
      }

      // Use the first active price
      price = prices.data[0];
      console.log("Using active price for product:", {
        priceId: price.id,
        productId: product.id,
        amount: price.unit_amount,
        currency: price.currency,
      });
    } catch (productError) {
      console.error("Product retrieval error:", productError);
      return NextResponse.json(
        { error: "Invalid or inaccessible product" },
        { status: 400 }
      );
    }

    // Get user from token
    const cookies = req.headers.get("cookie");
    const token = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.cappersports.co";

    // Create checkout session with different mode based on price type
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode:
        price.type === "recurring"
          ? ("subscription" as const)
          : ("payment" as const),
      payment_method_types: ["card"],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: new URL(
        `/cappers/${encodeURIComponent(capper.user.username)}`,
        baseUrl
      ).toString(),
      cancel_url: new URL(
        `/cappers/${encodeURIComponent(capper.user.username)}`,
        baseUrl
      ).toString(),
      metadata: {
        userId: payload.userId,
        capperId: capperId,
        productId: productId,
        priceId: price.id,
        priceType: price.type,
        interval: price.recurring?.interval || "one_time",
        packageType: price.type === "recurring" ? "recurring" : "one_time",
        stripeAccountId: capper.user.stripeConnectId,
      },
    };

    // Log the session configuration before creation
    console.log("Creating checkout session with config:", {
      mode: sessionConfig.mode,
      metadata: sessionConfig.metadata,
      lineItems: sessionConfig.line_items,
    });

    // If this is a zero-price product (price.unit_amount === 1), apply the coupon
    if (price.unit_amount === 1) {
      try {
        const product = await stripe.products.retrieve(productId, {
          stripeAccount: capper.user.stripeConnectId,
        });
        if (product.metadata.couponId) {
          sessionConfig.discounts = [
            {
              coupon: product.metadata.couponId,
            },
          ];
        }
      } catch (error) {
        console.error("Error retrieving product:", error);
        // Continue without the coupon if product retrieval fails
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig, {
      stripeAccount: capper.user.stripeConnectId,
    });

    // Log the created session
    console.log("Created checkout session:", {
      id: session.id,
      mode: session.mode,
      metadata: session.metadata,
      lineItems: session.line_items,
      paymentStatus: session.payment_status,
      status: session.status,
      subscription: session.subscription,
      customer: session.customer,
    });

    return NextResponse.json({
      sessionId: session.id,
      accountId: capper.user.stripeConnectId,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
