import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const cappers = await prisma.capper.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    const cappersWithProducts = await Promise.all(
      cappers.map(async (capper) => {
        if (capper.user.stripeConnectId) {
          try {
            const products = await stripe.products.list(
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

            const formattedProducts = products.data.map((product) => {
              const price = product.default_price as any;

              console.log("Product price data:", {
                productId: product.id,
                price: price,
              });

              return {
                id: product.id,
                name: product.name,
                description: product.description,
                default_price: price?.id,
                unit_amount: price?.unit_amount || 0,
                currency: price?.currency || "usd",
                features:
                  product.marketing_features?.map(
                    (feature: any) => feature.name
                  ) || [],
              };
            });

            return {
              ...capper,
              products: formattedProducts,
            };
          } catch (error) {
            console.error(
              `Error fetching products for capper ${capper.user.username}:`,
              error
            );
            return {
              ...capper,
              products: [],
            };
          }
        }
        return {
          ...capper,
          products: [],
        };
      })
    );

    return NextResponse.json(cappersWithProducts);
  } catch (error) {
    console.error("Error fetching cappers:", error);
    return NextResponse.json(
      { error: "Failed to fetch cappers" },
      { status: 500 }
    );
  }
}

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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tagToRemove } = body;

    if (!userId || !tagToRemove) {
      return NextResponse.json(
        { error: "User ID and tag are required" },
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

    const updatedTags = capper.tags.filter((tag) => tag !== tagToRemove);

    const updatedCapper = await prisma.capper.update({
      where: { userId },
      data: { tags: updatedTags },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Error removing tag:", error);
    return NextResponse.json(
      { error: "Failed to remove tag" },
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
