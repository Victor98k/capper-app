import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";
// import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    // Update token extraction to use cookies here too
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
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Add this before creating the account
    const platform = await stripe.accounts.retrieve("acct_1QWIPQKdsW3avvJO");

    // Ensure we have the base URL with proper format for general use
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://cappers-app.vercel.app";
    const websiteUrl = baseUrl.startsWith("http")
      ? baseUrl
      : `https://${baseUrl}`;

    // Create a Stripe Connect account
    const account = await stripe.accounts.create({
      type: "standard",
      country: "SE",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payments: {
          statement_descriptor: "CAPPERS CLUB",
        },
      },
      business_type: "individual",
      business_profile: {
        name: "Cappers Club",
        product_description: "Sports betting tips and predictions",
        mcc: "7999", // Merchant Category Code for Recreation Services
        // Only include URL if not localhost
        ...(process.env.NODE_ENV === "production" && {
          url: websiteUrl,
        }),
      },
    });

    // Update user with Stripe Connect ID
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeConnectId: account.id },
    });

    // Always use the main domain for redirect URLs
    const redirectDomain = "https://app.cappersports.co";

    // Create initial onboarding link with fixed redirect URLs
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${redirectDomain}/home-capper?refresh=true`,
      return_url: `${redirectDomain}/home-capper?success=true`,
      type: "account_onboarding",
      collect: "eventually_due",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe Connect error:", error);

    // Improved error handling
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Invalid request to Stripe" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add endpoint to check onboarding status
export async function GET(req: Request) {
  try {
    // Update token extraction to use cookies instead of Authorization header
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
    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check rate limit
    // const { isAllowed, remaining } = await rateLimit(payload.userId);
    // if (!isAllowed) {
    //   return NextResponse.json(
    //     {
    //       error: "Too many requests",
    //       retryAfter: 60,
    //     },
    //     { status: 429 }
    //   );
    // }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        stripeConnectId: true,
        stripeConnectOnboarded: true,
        payoutEnabled: true,
      },
    });

    if (!user?.stripeConnectId) {
      return NextResponse.json({
        onboarded: false,
        payoutsEnabled: false,
      });
    }

    // Fetch latest account status from Stripe
    const account = await stripe.accounts.retrieve(user.stripeConnectId);

    // For Standard accounts, we return the Stripe dashboard URL directly
    const dashboardUrl = `https://dashboard.stripe.com/${account.id}`;

    // Update user status in database if it has changed
    if (
      account.details_submitted !== user.stripeConnectOnboarded ||
      account.payouts_enabled !== user.payoutEnabled
    ) {
      await prisma.user.update({
        where: { id: payload.userId },
        data: {
          stripeConnectOnboarded: account.details_submitted,
          payoutEnabled: account.payouts_enabled,
        },
      });
    }

    return NextResponse.json({
      onboarded: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
      url: dashboardUrl, // Direct Stripe dashboard URL
    });
  } catch (error) {
    console.error("Stripe status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
