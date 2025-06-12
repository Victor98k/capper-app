import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function POST(req: Request) {
  try {
    // Get token from cookies
    const cookies = req.headers.get("cookie");
    const token = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify JWT token and check if super user
    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if the user is a super user
    const superUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isSuperUser: true },
    });

    if (!superUser?.isSuperUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the target user ID from the request body
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user and check if they have a Stripe account
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeConnectId: true,
        stripeConnectOnboarded: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user?.stripeConnectId) {
      return NextResponse.json(
        { error: "No Stripe account found" },
        { status: 404 }
      );
    }

    try {
      // Get the existing account details
      const existingAccount = await stripe.accounts.retrieve(
        user.stripeConnectId
      );

      // Create a new Express account
      const newAccount = await stripe.accounts.create({
        type: "express",
        country: existingAccount.country || "SE",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: existingAccount.business_type || "individual",
        business_profile: {
          name: `${user.firstName} ${user.lastName}`,
          product_description: "Sports content",
          mcc: "7999",
        },
      });

      // Create a new account link for the converted account
      const accountLink = await stripe.accountLinks.create({
        account: newAccount.id,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/home-capper?refresh=true`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/home-capper?success=true`,
        type: "account_onboarding",
      });

      // Update the user's Stripe Connect ID in the database
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeConnectId: newAccount.id,
          stripeConnectOnboarded: false, // Reset onboarding status for the new account
        },
      });

      return NextResponse.json({
        message: "Account successfully converted to Express",
        accountLink: accountLink.url,
        account: newAccount,
        oldAccountId: user.stripeConnectId, // Include the old account ID for reference
      });
    } catch (stripeError: any) {
      console.error("Stripe conversion error:", stripeError);

      // Handle specific Stripe errors
      if (stripeError.type === "StripeError") {
        return NextResponse.json(
          {
            error: stripeError.message,
            code: stripeError.code,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Failed to convert Stripe account" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error converting Stripe account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
