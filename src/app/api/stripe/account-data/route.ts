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
    const [account, balance] = await Promise.all([
      stripe.accounts.retrieve(user.stripeConnectId),
      stripe.balance.retrieve({
        stripeAccount: user.stripeConnectId,
      }),
    ]);

    // Fetch all subscriptions
    let allSubscriptions: Stripe.Subscription[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
      const subResponse: Stripe.Response<Stripe.ApiList<Stripe.Subscription>> =
        await stripe.subscriptions.list(
          {
            status: "active",
            expand: ["data.customer"],
            starting_after: startingAfter,
          },
          {
            stripeAccount: user.stripeConnectId,
          }
        );

      allSubscriptions = [...allSubscriptions, ...subResponse.data];
      hasMore = subResponse.has_more;

      if (hasMore && subResponse.data.length > 0) {
        startingAfter = subResponse.data[subResponse.data.length - 1].id;
      }
    }

    // Calculate total balance
    const totalBalance = balance.available.reduce((sum, bal) => {
      return sum + bal.amount;
    }, 0);

    // Get recent payouts
    const payouts = await stripe.payouts.list(
      { limit: 5 },
      { stripeAccount: user.stripeConnectId }
    );

    // Fetch active customers who purchased one-time packages
    let allCustomers: Stripe.Customer[] = [];
    let hasMoreCustomers = true;
    let startingAfterCustomer: string | undefined = undefined;

    while (hasMoreCustomers) {
      const customerResponse: Stripe.Response<Stripe.ApiList<Stripe.Customer>> =
        await stripe.customers.list(
          {
            limit: 100,
            starting_after: startingAfterCustomer,
          },
          {
            stripeAccount: user.stripeConnectId,
          }
        );

      allCustomers = [...allCustomers, ...customerResponse.data];
      hasMoreCustomers = customerResponse.has_more;

      if (hasMoreCustomers && customerResponse.data.length > 0) {
        startingAfterCustomer =
          customerResponse.data[customerResponse.data.length - 1].id;
      }
    }

    // Return the data including active customers
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
        total: allSubscriptions.length,
        monthlyRecurringRevenue: allSubscriptions.reduce(
          (sum, sub) =>
            sum + (sub.items.data[0]?.price?.unit_amount || 0) / 100,
          0
        ),
      },
      activeCustomers: allCustomers.map((customer) => ({
        id: customer.id,
        email: customer.email,
        name: customer.name,
      })),
    });
  } catch (error) {
    console.error("Error fetching Stripe account data:", error);
    return NextResponse.json(
      { error: "Failed to fetch account data" },
      { status: 500 }
    );
  }
}
