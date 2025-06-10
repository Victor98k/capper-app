import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";
import Stripe from "stripe";

export async function GET(req: Request) {
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

    // Fetch products for this connected account
    const products = await stripe.products.list(
      { active: true, expand: ["data.default_price"] },
      { stripeAccount: user.stripeConnectId }
    );

    // Transform the products data
    const transformedProducts = products.data.map(
      (product: Stripe.Product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        default_price: product.default_price,
        unit_amount: (product.default_price as Stripe.Price)?.unit_amount,
        currency: (product.default_price as Stripe.Price)?.currency,
        features: product.metadata.features
          ? JSON.parse(product.metadata.features)
          : [],
      })
    );

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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
      interval = "month",
      features = [],
    } = await req.json();

    if (!name || !price || price < 1) {
      return NextResponse.json(
        { error: "Invalid product data" },
        { status: 400 }
      );
    }

    // Create the product
    const product = await stripe.products.create(
      {
        name,
        description,
        metadata: {
          userId: payload.userId,
          features: JSON.stringify(features),
        },
      },
      { stripeAccount: user.stripeConnectId }
    );

    // Create the price
    const priceObject = await stripe.prices.create(
      {
        product: product.id,
        unit_amount: Math.round(price * 100), // Convert to cents
        currency: "sek",
        recurring: interval === "one_time" ? undefined : { interval },
      },
      { stripeAccount: user.stripeConnectId }
    );

    // Set this price as the default for the product
    await stripe.products.update(
      product.id,
      { default_price: priceObject.id },
      { stripeAccount: user.stripeConnectId }
    );

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        default_price: priceObject,
        features: features,
      },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
