import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { verifyJWT } from "@/utils/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

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

    try {
      // Fetch all products for the connected account
      const products = await stripe.products.list({
        active: true,
        expand: ["data.default_price"],
        stripeAccount: user.stripeConnectId,
        type: "service", // Only fetch service type products
        limit: 3, // Increase limit if needed
      } as any);

      // Remove the product_catalog parameter since we want all products
      const prices = await stripe.prices.list({
        active: true,
        stripeAccount: user.stripeConnectId,
        type: "recurring", // Only fetch subscription prices
      } as any);

      const formattedProducts = await Promise.all(
        products.data.map(async (product) => {
          // Find the recurring price for this product
          const productPrice = prices.data.find(
            (price) =>
              price.id === product.default_price && price.type === "recurring"
          );

          // Extract features from marketing_features
          const features = product.marketing_features
            ? product.marketing_features.map((feature) => feature.name)
            : [];

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            default_price: product.default_price,
            unit_amount: productPrice?.unit_amount || 0,
            currency: productPrice?.currency || "usd",
            features: features,
          };
        })
      );

      // Only return products that have recurring prices
      const subscriptionProducts = formattedProducts.filter(
        (product) => product.unit_amount > 0
      );

      console.log("Subscription products found:", subscriptionProducts.length);
      return NextResponse.json(subscriptionProducts);
    } catch (stripeError: any) {
      console.error("Stripe error:", stripeError);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
