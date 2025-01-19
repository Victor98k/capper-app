import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";

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

export async function GET(
  req: Request,
  context: { params: { username: string } }
) {
  const { username } = context.params; // Destructure like in your working example
  const cookies = req.headers.get("cookie");

  // Basic auth check similar to your working endpoint
  // if (!cookies) {
  //   return NextResponse.json({ error: "No authentication" }, { status: 401 });
  // }

  try {
    // Find the capper by username through the User relation
    const capper = await prisma.capper.findFirst({
      where: {
        user: {
          username: username,
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

    // Fetch Stripe products if the capper has a connected account
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

      products = stripeProducts.data.map((product) => {
        const price = product.default_price as any;
        let features = [];

        if (Array.isArray((product as any).features)) {
          features = (product as any).features.map(
            (feature: any) => feature.name
          );
        } else if (product.metadata?.features) {
          try {
            features = JSON.parse(product.metadata.features);
          } catch (error) {
            console.error(
              `Error parsing features for product ${product.id}:`,
              error
            );
          }
        }

        if (!features || features.length === 0) {
          features = [
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
          features: features,
        };
      });
    }

    const capperWithProducts = {
      ...capper,
      products,
    };

    return NextResponse.json(capperWithProducts);
  } catch (error) {
    console.error("Error fetching capper:", error);
    return NextResponse.json(
      { error: "Failed to fetch capper" },
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
