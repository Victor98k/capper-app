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
      // Match the format used in the capper profile route
      const products = await stripe.products.list(
        {
          active: true,
          expand: ["data.default_price"],
          limit: 100,
          type: "service",
        },
        {
          stripeAccount: user.stripeConnectId, // Pass as option instead of parameter
        }
      );

      console.log("Products found:", products.data.length);

      const prices = await stripe.prices.list(
        {
          active: true,
          type: "recurring",
        },
        {
          stripeAccount: user.stripeConnectId,
        }
      );

      const formattedProducts = await Promise.all(
        products.data.map(async (product) => {
          const productPrice = prices.data.find(
            (price) =>
              price.id === product.default_price && price.type === "recurring"
          );

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            default_price: product.default_price,
            unit_amount: productPrice?.unit_amount || 0,
            currency: productPrice?.currency || "usd",
            features: product.marketing_features
              ? product.marketing_features.map((feature: any) => feature.name)
              : [],
          };
        })
      );

      const subscriptionProducts = formattedProducts.filter(
        (product) => product.unit_amount > 0
      );

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
