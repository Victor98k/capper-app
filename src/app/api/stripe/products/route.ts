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
      const products = await stripe.products.list(
        {
          active: true,
          expand: ["data.default_price"],
          limit: 100,
          type: "service",
        },
        {
          stripeAccount: user.stripeConnectId,
        }
      );

      console.log("Products found:", products.data.length);

      const prices = await stripe.prices.list(
        {
          active: true,
          type: "recurring",
          expand: ["data.product"],
        },
        {
          stripeAccount: user.stripeConnectId,
        }
      );

      console.log("Prices found:", prices.data.length);

      const formattedProducts = await Promise.all(
        products.data.map(async (product) => {
          const productPrices = prices.data.filter(
            (price) =>
              price.product === product.id && price.type === "recurring"
          );

          console.log("Product prices:", {
            productId: product.id,
            name: product.name,
            pricesFound: productPrices.length,
            prices: productPrices.map((p) => ({
              id: p.id,
              unitAmount: p.unit_amount,
              type: p.type,
            })),
          });

          // Use the first active price if available
          const productPrice = productPrices[0];

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            default_price: productPrice?.id || product.default_price,
            unit_amount: productPrice?.unit_amount || 0, // Return 0 if no price
            currency: productPrice?.currency || "usd",
            features: product.marketing_features
              ? product.marketing_features.map((feature: any) => feature.name)
              : [],
            prices: productPrices.map((p) => ({
              id: p.id,
              unit_amount: p.unit_amount,
              currency: p.currency,
            })),
          };
        })
      );

      // Remove the filter - return all products regardless of price
      // const subscriptionProducts = formattedProducts.filter(
      //   (product) => product.prices && product.prices.length > 0
      // );

      console.log("Final products:", {
        total: formattedProducts.length,
        products: formattedProducts.map((p) => ({
          id: p.id,
          name: p.name,
          hasPrice: p.unit_amount > 0,
        })),
      });

      // Return all products, not just ones with prices
      return NextResponse.json(formattedProducts);
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
