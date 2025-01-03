import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";
import Stripe from "stripe";

export async function GET(req: Request) {
  try {
    const cookies = req.headers.get("cookie");
    const cookiesArray =
      cookies?.split(";").map((cookie) => cookie.trim()) || [];
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );
    const token = tokenCookie?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get the user's Stripe Connect ID and onboarding status
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        stripeConnectId: true,
        stripeConnectOnboarded: true,
      },
    });

    if (!user?.stripeConnectId) {
      return NextResponse.json(
        {
          error: "No Stripe account found",
          code: "NO_STRIPE_ACCOUNT",
        },
        { status: 404 }
      );
    }

    if (!user.stripeConnectOnboarded) {
      return NextResponse.json(
        {
          error: "Stripe account not fully onboarded",
          code: "ONBOARDING_INCOMPLETE",
        },
        { status: 400 }
      );
    }

    try {
      // Generate a login link for the connected account
      const loginLink = await stripe.accounts.createLoginLink(
        user.stripeConnectId
      );
      return NextResponse.json({ url: loginLink.url });
    } catch (stripeError) {
      if (stripeError instanceof Stripe.errors.StripeError) {
        // Handle specific Stripe errors
        if (stripeError.code === "account_invalid") {
          return NextResponse.json(
            {
              error: "Your Stripe account needs attention",
              code: "ACCOUNT_INVALID",
            },
            { status: 400 }
          );
        }
      }
      throw stripeError; // Re-throw other Stripe errors
    }
  } catch (error) {
    console.error("Error generating dashboard link:", error);
    return NextResponse.json(
      {
        error: "Failed to generate dashboard link",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
