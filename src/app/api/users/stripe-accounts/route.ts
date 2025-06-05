import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function GET(req: Request) {
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

    // Verify JWT token
    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if the user is a super user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isSuperUser: true },
    });

    if (!user?.isSuperUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all users with Stripe accounts
    const usersWithStripe = await prisma.user.findMany({
      where: {
        stripeConnectId: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        stripeConnectId: true,
      },
    });

    // Fetch additional details from Stripe for each account
    const accountsWithDetails = await Promise.all(
      usersWithStripe.map(async (user) => {
        try {
          const stripeAccount = await stripe.accounts.retrieve(
            user.stripeConnectId!
          );

          return {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            payoutsEnabled: stripeAccount.payouts_enabled,
            chargesEnabled: stripeAccount.charges_enabled,
            detailsSubmitted: stripeAccount.details_submitted,
          };
        } catch (error) {
          console.error(
            `Error fetching Stripe account for user ${user.id}:`,
            error
          );
          // Return basic user info with default Stripe values if there's an error
          return {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            payoutsEnabled: false,
            chargesEnabled: false,
            detailsSubmitted: false,
          };
        }
      })
    );

    return NextResponse.json(accountsWithDetails);
  } catch (error) {
    console.error("Error fetching Stripe accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch Stripe accounts" },
      { status: 500 }
    );
  }
}
