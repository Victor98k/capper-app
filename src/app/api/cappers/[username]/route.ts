import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bio } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updatedCapper = await prisma.capper.update({
      where: { userId: userId },
      data: { bio },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Error updating capper profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extract username from the URL and decode it
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const usernameIndex = segments.indexOf("cappers") + 1;
    const encodedUsername = segments[usernameIndex];
    const username = decodeURIComponent(encodedUsername);

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const capper = await prisma.capper.findFirst({
      where: {
        user: {
          username,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            stripeConnectId: true,
          },
        },
      },
    });

    if (!capper) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    let products: any[] = [];
    if (capper.user.stripeConnectId) {
      console.log("Fetching products for capper:", {
        capperId: capper.id,
        stripeAccountId: capper.user.stripeConnectId,
      });

      const stripeProducts = await stripe.products.list(
        {
          expand: ["data.default_price"],
          limit: 100,
          active: true,
          type: "service",
        },
        {
          stripeAccount: capper.user.stripeConnectId,
        }
      );

      console.log("Retrieved products from Stripe:", {
        count: stripeProducts.data.length,
        products: stripeProducts.data.map((p: Stripe.Product) => ({
          id: p.id,
          name: p.name,
          defaultPriceId: (p.default_price as Stripe.Price)?.id,
        })),
      });

      products = stripeProducts.data.map(
        (product: Stripe.Product & { features?: Array<{ name: string }> }) => {
          const price = product.default_price as Stripe.Price;
          const marketing_features = product.metadata.features
            ? JSON.parse(product.metadata.features)
            : [];

          console.log("Processing product:", {
            productId: product.id,
            priceId: price?.id,
            priceType: price?.type,
          });

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            default_price: {
              id: price?.id,
              recurring: price?.recurring,
              unit_amount: price?.unit_amount || 0,
              currency: price?.currency || "usd",
              type: price?.type || "one_time",
            },
            marketing_features,
          };
        }
      );
    }

    // Fetch all active subscriptions for this capper
    const subscriptions = await prisma.subscription.findMany({
      where: {
        capperId: capper.id,
        status: "active",
      },
      select: {
        userId: true,
      },
    });

    // Get unique user IDs (subscribers)
    const subscriberIds = [...new Set(subscriptions.map((sub) => sub.userId))];

    return NextResponse.json({ ...capper, products, subscriberIds });
  } catch (error) {
    console.error("Error fetching capper:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tags } = body;

    if (!userId || !tags?.length) {
      return NextResponse.json(
        { error: "User ID and tags are required" },
        { status: 400 }
      );
    }

    const capper = await prisma.capper.findUnique({
      where: { userId },
      select: { tags: true },
    });

    if (!capper) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    const updatedTags = [...new Set([...capper.tags, ...tags])];

    const updatedCapper = await prisma.capper.update({
      where: { userId },
      data: { tags: updatedTags },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Error adding tags:", error);
    return NextResponse.json({ error: "Failed to add tags" }, { status: 500 });
  }
}
