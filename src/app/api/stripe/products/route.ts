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
        hasDiscount: product.metadata.hasDiscount === "true",
        discountType: product.metadata.discountType,
        discountValue: product.metadata.discountValue
          ? parseFloat(product.metadata.discountValue)
          : undefined,
        discountDuration: product.metadata.discountDuration,
        discountDurationInMonths: product.metadata.discountDurationInMonths
          ? parseInt(product.metadata.discountDurationInMonths)
          : undefined,
        couponId: product.metadata.couponId,
        freeCouponId: product.metadata.freeCouponId,
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
      packageType = "one_time",
      interval = "week",
      features = [],
      currency = "eur", // Default to EUR if not provided
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

    // Determine if this is a recurring subscription based on interval
    const isRecurring = interval !== "one_time";
    const finalPackageType = isRecurring ? "recurring" : packageType;

    // Create discount coupon if specified
    let couponId = null;
    if (hasDiscount && discountValue > 0) {
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
    }

    // Create the product
    const product = await stripe.products.create(
      {
        name,
        description,
        metadata: {
          userId: payload.userId,
          features: JSON.stringify(features),
          interval: interval,
          packageType: finalPackageType,
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

    // Update the product to include its ID in metadata
    await stripe.products.update(
      product.id,
      { metadata: { ...product.metadata, productId: product.id } },
      { stripeAccount: user.stripeConnectId }
    );

    // For zero-price products, create a price of 1 and a 100% off coupon
    let priceObject;
    if (price === 0) {
      // Create a price of 1 unit
      priceObject = await stripe.prices.create(
        {
          product: product.id,
          unit_amount: 1, // 1 cent/øre
          currency: currency.toLowerCase(),
          recurring: isRecurring ? { interval } : undefined,
        },
        { stripeAccount: user.stripeConnectId }
      );

      // Create a 100% off coupon for free products (separate from discount coupon)
      const freeCoupon = await stripe.coupons.create(
        {
          percent_off: 100,
          duration: isRecurring ? "forever" : "once",
        },
        { stripeAccount: user.stripeConnectId }
      );

      // Store the free coupon ID in the product metadata (separate from discount coupon)
      await stripe.products.update(
        product.id,
        { metadata: { ...product.metadata, freeCouponId: freeCoupon.id } },
        { stripeAccount: user.stripeConnectId }
      );
    } else {
      // Create the price with the specified amount
      priceObject = await stripe.prices.create(
        {
          product: product.id,
          unit_amount: Math.round(price * 100),
          currency: currency.toLowerCase(),
          recurring: isRecurring ? { interval } : undefined,
        },
        { stripeAccount: user.stripeConnectId }
      );
    }

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
        couponId: price === 0 ? product.metadata.freeCouponId : couponId,
        discountCouponId: couponId,
        hasDiscount: hasDiscount,
        discountType: hasDiscount ? discountType : undefined,
        discountValue: hasDiscount ? discountValue : undefined,
        discountDuration: hasDiscount ? discountDuration : undefined,
        discountDurationInMonths:
          hasDiscount && discountDuration === "repeating"
            ? discountDurationInMonths
            : undefined,
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
