import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { verifyJWT } from "@/utils/jwt";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

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
          limit: 3,
        },
        {
          stripeAccount: user.stripeConnectId,
        }
      );

      console.log("Raw products data:", JSON.stringify(products.data, null, 2));

      // Transform the products to include price information
      const transformedProducts = products.data.map((product) => {
        const price = product.default_price as Stripe.Price;

        // Extract features from marketing_features array
        const features = product.marketing_features
          ? product.marketing_features.map(
              (feature: Stripe.Product.MarketingFeature) => feature.name
            )
          : [];

        // console.log("Transforming product:", {
        //   id: product.id,
        //   name: product.name,
        //   marketing_features: product.marketing_features,
        //   extractedFeatures: features,
        // });

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          default_price: price?.id || null,
          unit_amount: price?.unit_amount || null,
          currency: price?.currency || "usd",
          features: features,
        };
      });

      return NextResponse.json(transformedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in products route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
