import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
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
    console.log("Platform status:", {
      charges_enabled: platform.charges_enabled,
      payouts_enabled: platform.payouts_enabled,
      details_submitted: platform.details_submitted,
    });

    // Create a Stripe Connect account
    const account = await stripe.accounts.create({
      type: "express",
      country: "SE", // Sweden's country code
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Update user with Stripe Connect ID
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeConnectId: account.id },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/home-capper?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/home-capper?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add endpoint to check onboarding status
export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user?.stripeConnectId) {
      return NextResponse.json(
        { error: "No Connect account" },
        { status: 404 }
      );
    }

    const account = await stripe.accounts.retrieve(user.stripeConnectId);

    // Update user's onboarding status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeConnectOnboarded: account.details_submitted,
        payoutEnabled: account.payouts_enabled,
      },
    });

    return NextResponse.json({
      onboarded: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (error) {
    console.error("Stripe Connect status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
