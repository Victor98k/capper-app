import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";
import Stripe from "stripe";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    // Get token from cookies
    const cookies = req.headers.get("cookie");
    const cookiesArray =
      cookies?.split(";").map((cookie) => cookie.trim()) || [];
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );
    const token = tokenCookie?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get the user's Stripe Connect ID
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { stripeConnectId: true },
    });

    if (!user?.stripeConnectId) {
      return NextResponse.json(
        { error: "No Stripe account found" },
        { status: 404 }
      );
    }

    // Get product data from request body
    const {
      name,
      description,
      price,
      features = [],
      currency = "eur",
    } = await req.json();

    if (!name || price === undefined || price < 0) {
      return NextResponse.json(
        { error: "Invalid product data" },
        { status: 400 }
      );
    }

    // Validate currency
    try {
      // This will throw an error if the currency code is invalid
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: currency.toLowerCase(),
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid currency code" },
        { status: 400 }
      );
    }

    // Get the existing product
    const existingProduct = await stripe.products.retrieve(
      (await params).productId,
      {
        stripeAccount: user.stripeConnectId,
      }
    );

    // Update the product
    const updatedProduct = await stripe.products.update(
      (await params).productId,
      {
        name,
        description,
        metadata: {
          ...existingProduct.metadata,
          features: JSON.stringify(features),
        },
      },
      { stripeAccount: user.stripeConnectId }
    );

    // Create a new price if the price has changed
    if (price !== existingProduct.default_price?.unit_amount / 100) {
      const newPrice = await stripe.prices.create(
        {
          product: (await params).productId,
          unit_amount: Math.round(price * 100),
          currency: currency.toLowerCase(),
          recurring: (existingProduct.default_price as Stripe.Price)?.recurring,
        },
        { stripeAccount: user.stripeConnectId }
      );

      // Set the new price as default
      await stripe.products.update(
        (await params).productId,
        { default_price: newPrice.id },
        { stripeAccount: user.stripeConnectId }
      );
    }

    return NextResponse.json({
      product: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        features: features,
      },
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
