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
        const price = product.default_price as any;
        let marketing_features = [];

        // Extract marketing features from the product
        if (Array.isArray(product.marketing_features)) {
          marketing_features = product.marketing_features.map(
            (feature: any) => feature.name
          );
        }

        // Fallback if no marketing features are found
        if (!marketing_features || marketing_features.length === 0) {
          marketing_features = [
            `Access to all ${product.name} picks`,
            "Daily expert predictions",
            "Performance tracking",
            "Real-time updates",
            "Expert analysis",
          ];
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          default_price: price?.id,
          unit_amount: price?.unit_amount || 0,
          currency: price?.currency || "usd",
          marketing_features: marketing_features,
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
