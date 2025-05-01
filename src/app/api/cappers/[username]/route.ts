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
    // Extract username from the URL
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const usernameIndex = segments.indexOf("cappers") + 1;
    const username = segments[usernameIndex];

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

      products = stripeProducts.data.map((product: Stripe.Product) => {
        const price = product.default_price as Stripe.Price;
        const marketing_features = Array.isArray(product.marketing_features)
          ? product.marketing_features.map((f: any) => f.name)
          : [`Access to all ${product.name} picks`];

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
      });
    }

    return NextResponse.json({ ...capper, products });
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
