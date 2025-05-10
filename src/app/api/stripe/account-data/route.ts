import { NextResponse } from "next/server";
import Stripe from "stripe";
import { verifyJWT } from "@/utils/jwt";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function GET(request: Request) {
  try {
    // Get token from cookies
    const cookies = request.headers.get("cookie");
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

    // Get user and check if they are a capper
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        capperProfile: true,
      },
    });

    if (!user?.isCapper || !user.stripeConnectId) {
      return NextResponse.json(
        { error: "No Stripe account found" },
        { status: 404 }
      );
    }

    // Fetch account data from Stripe
    const [account, balance, subscriptions] = await Promise.all([
      stripe.accounts.retrieve(user.stripeConnectId),
      stripe.balance.retrieve({
        stripeAccount: user.stripeConnectId,
      }),
      stripe.subscriptions.list(
        {
          status: "active",
          expand: ["data.customer"],
        },
        {
          stripeAccount: user.stripeConnectId,
        }
      ),
    ]);

    // console.log("Stripe Account Data:", {
    //   payoutsEnabled: account.payouts_enabled,
    //   chargesEnabled: account.charges_enabled,
    //   defaultCurrency: account.default_currency,
    // });

    // Calculate total balance
    const totalBalance = balance.available.reduce((sum, bal) => {
      return sum + bal.amount;
    }, 0);

    // console.log("Stripe Balance:", {
    //   available: balance.available,
    //   pending: balance.pending,
    //   totalBalance: totalBalance / 100,
    // });

    // Get recent payouts
    const payouts = await stripe.payouts.list(
      { limit: 5 },
      { stripeAccount: user.stripeConnectId }
    );

    console.log(
      "Recent Payouts:",
      payouts.data.map((payout) => ({
        amount: payout.amount / 100,
        status: payout.status,
        arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
      }))
    );

    console.log("Subscription Data:", {
      activeSubscriptions: subscriptions.data.length,
      monthlyRecurringRevenue: subscriptions.data.reduce(
        (sum, sub) => sum + (sub.items.data[0]?.price?.unit_amount || 0) / 100,
        0
      ),
    });

    return NextResponse.json({
      totalBalance: totalBalance / 100,
      payoutEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
      defaultCurrency: account.default_currency,
      recentPayouts: payouts.data.map((payout) => ({
        amount: payout.amount / 100,
        status: payout.status,
        arrivalDate: payout.arrival_date,
      })),
      subscriptions: {
        total: subscriptions.data.length,
        monthlyRecurringRevenue: subscriptions.data.reduce(
          (sum, sub) =>
            sum + (sub.items.data[0]?.price?.unit_amount || 0) / 100,
          0
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching Stripe account data:", error);
    return NextResponse.json(
      { error: "Failed to fetch account data" },
      { status: 500 }
    );
  }
}
