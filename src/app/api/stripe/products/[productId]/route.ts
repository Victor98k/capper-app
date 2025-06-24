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
      hasDiscount = false,
      discountType = "percentage",
      discountValue,
      discountDuration = "once",
      discountDurationInMonths,
    } = await req.json();

    if (!name || price === undefined || price < 0) {
      return NextResponse.json(
        { error: "Invalid product data" },
        { status: 400 }
      );
    }

    // Validate discount data if discount is enabled
    if (hasDiscount) {
      if (!discountValue || discountValue <= 0) {
        return NextResponse.json(
          { error: "Invalid discount value" },
          { status: 400 }
        );
      }

      if (discountType === "percentage" && discountValue > 100) {
        return NextResponse.json(
          { error: "Percentage discount cannot exceed 100%" },
          { status: 400 }
        );
      }

      if (
        discountDuration === "repeating" &&
        (!discountDurationInMonths || discountDurationInMonths <= 0)
      ) {
        return NextResponse.json(
          { error: "Invalid discount duration" },
          { status: 400 }
        );
      }
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

    // Handle discount coupon creation/update
    let couponId = existingProduct.metadata.couponId || null;

    if (hasDiscount && discountValue > 0) {
      // If there's an existing coupon, delete it first
      if (couponId) {
        try {
          await stripe.coupons.del(couponId, {
            stripeAccount: user.stripeConnectId,
          });
        } catch (error) {
          console.log("Failed to delete existing coupon:", error);
          // Continue anyway - the old coupon might already be deleted
        }
      }

      // Create new coupon
      const couponData: any = {
        duration: discountDuration,
      };

      if (discountType === "percentage") {
        couponData.percent_off = discountValue;
      } else {
        couponData.amount_off = Math.round(discountValue * 100); // Convert to cents
        couponData.currency = currency.toLowerCase();
      }

      if (discountDuration === "repeating") {
        couponData.duration_in_months = discountDurationInMonths;
      }

      try {
        const coupon = await stripe.coupons.create(couponData, {
          stripeAccount: user.stripeConnectId,
        });
        couponId = coupon.id;
      } catch (error) {
        console.error("Error creating coupon:", error);
        return NextResponse.json(
          { error: "Failed to create discount coupon" },
          { status: 500 }
        );
      }
    } else if (!hasDiscount && couponId) {
      // Remove existing coupon if discount is disabled
      try {
        await stripe.coupons.del(couponId, {
          stripeAccount: user.stripeConnectId,
        });
        couponId = null;
      } catch (error) {
        console.log("Failed to delete existing coupon:", error);
        // Continue anyway
        couponId = null;
      }
    }

    // Update the product with new metadata
    const updatedProduct = await stripe.products.update(
      (await params).productId,
      {
        name,
        description,
        metadata: {
          ...existingProduct.metadata,
          features: JSON.stringify(features),
          hasDiscount: hasDiscount.toString(),
          discountType: hasDiscount ? discountType : undefined,
          discountValue: hasDiscount ? discountValue.toString() : undefined,
          discountDuration: hasDiscount ? discountDuration : undefined,
          discountDurationInMonths:
            hasDiscount && discountDuration === "repeating"
              ? discountDurationInMonths.toString()
              : undefined,
          couponId: couponId || undefined,
        },
      },
      { stripeAccount: user.stripeConnectId }
    );

    // Create a new price if the price has changed
    const existingPrice = existingProduct.default_price as Stripe.Price;
    if (price !== (existingPrice?.unit_amount || 0) / 100) {
      const newPrice = await stripe.prices.create(
        {
          product: (await params).productId,
          unit_amount: Math.round(price * 100),
          currency: currency.toLowerCase(),
          recurring: existingPrice?.recurring,
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
        hasDiscount: hasDiscount,
        discountType: hasDiscount ? discountType : undefined,
        discountValue: hasDiscount ? discountValue : undefined,
        discountDuration: hasDiscount ? discountDuration : undefined,
        discountDurationInMonths:
          hasDiscount && discountDuration === "repeating"
            ? discountDurationInMonths
            : undefined,
        couponId: couponId,
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

export async function DELETE(
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

    const productId = (await params).productId;

    // Get the existing product
    const existingProduct = await stripe.products.retrieve(productId, {
      stripeAccount: user.stripeConnectId,
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Instead of deleting, we'll archive the product by setting it as inactive
    // and adding an archived flag to metadata
    const archivedProduct = await stripe.products.update(
      productId,
      {
        active: false,
        metadata: {
          ...existingProduct.metadata,
          archived: "true",
          archivedAt: new Date().toISOString(),
        },
      },
      { stripeAccount: user.stripeConnectId }
    );

    return NextResponse.json({
      success: true,
      message: "Product archived successfully",
      product: {
        id: archivedProduct.id,
        name: archivedProduct.name,
        archived: true,
      },
    });
  } catch (error) {
    console.error("Error archiving product:", error);
    return NextResponse.json(
      { error: "Failed to archive product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const { action } = await req.json();
    const productId = (await params).productId;

    if (action === "restore") {
      // Get the existing product
      const existingProduct = await stripe.products.retrieve(productId, {
        stripeAccount: user.stripeConnectId,
      });

      if (!existingProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Restore the product by setting it as active and removing archived flag
      const restoredProduct = await stripe.products.update(
        productId,
        {
          active: true,
          metadata: {
            ...existingProduct.metadata,
            archived: "false",
            restoredAt: new Date().toISOString(),
          },
        },
        { stripeAccount: user.stripeConnectId }
      );

      return NextResponse.json({
        success: true,
        message: "Product restored successfully",
        product: {
          id: restoredProduct.id,
          name: restoredProduct.name,
          archived: false,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing product action:", error);
    return NextResponse.json(
      { error: "Failed to process product action" },
      { status: 500 }
    );
  }
}
