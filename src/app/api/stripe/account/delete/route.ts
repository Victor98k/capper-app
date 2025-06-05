import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function DELETE(req: Request) {
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
      },
    });

    if (!user?.stripeConnectId) {
      return NextResponse.json(
        { error: "No Stripe account found" },
        { status: 404 }
      );
    }

    try {
      // Attempt to delete the Stripe account
      const deletedAccount = await stripe.accounts.del(user.stripeConnectId);

      if (deletedAccount.deleted) {
        // Update user record to remove Stripe connection
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeConnectId: null,
            stripeConnectOnboarded: false,
            payoutEnabled: false,
          },
        });

        return NextResponse.json({
          message: "Stripe account successfully deleted",
          deleted: true,
        });
      } else {
        throw new Error("Failed to delete Stripe account");
      }
    } catch (stripeError: any) {
      console.error("Stripe deletion error:", stripeError);

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
        { error: "Failed to delete Stripe account" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error deleting Stripe account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
