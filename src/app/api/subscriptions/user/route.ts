import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const userId = req.headers.get("userId");
    console.log("Received request for user subscriptions:", userId);

    if (!userId) {
      console.log("No userId in headers");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // First verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("User not found:", userId);
      return new NextResponse("User not found", { status: 404 });
    }

    // First, get just the subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: userId,
        status: "active",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        userId: true,
        capperId: true,
        productId: true,
        status: true,
        subscribedAt: true,
        expiresAt: true,
        cancelledAt: true,
        stripeSubscriptionId: true,
        stripePaymentIntentId: true,
        stripeCustomerId: true,
      },
    });

    console.log(`Found ${subscriptions.length} total subscriptions`);

    // Then, for each subscription, get the capper and user data separately
    const enrichedSubscriptions = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          // First check if the capper exists and has a valid user
          const capperCheck = await prisma.capper.findFirst({
            where: {
              id: subscription.capperId,
              user: {
                isNot: undefined,
              },
            },
            select: { id: true },
          });

          if (!capperCheck) {
            console.log(
              `Skipping subscription ${subscription.id} - capper ${subscription.capperId} has no valid user`
            );
            return null;
          }

          // Now fetch the full capper data
          const capperWithUser = await prisma.capper.findUnique({
            where: {
              id: subscription.capperId,
            },
            select: {
              id: true,
              userId: true,
              bio: true,
              title: true,
              imageUrl: true,
              socialLinks: true,
              tags: true,
              roi: true,
              user: {
                select: {
                  username: true,
                  firstName: true,
                  lastName: true,
                  imageUrl: true,
                },
              },
            },
          });

          if (capperWithUser && capperWithUser.user) {
            return {
              ...subscription,
              capper: capperWithUser,
            };
          }
          return null;
        } catch (error) {
          console.error(
            `Error fetching capper data for subscription ${subscription.id}:`,
            error
          );
          return null;
        }
      })
    );

    // Filter out any null results (where capper or user was missing)
    const validSubscriptions = enrichedSubscriptions.filter(
      (sub): sub is NonNullable<typeof sub> => sub !== null
    );

    console.log(
      `Found ${validSubscriptions.length} valid subscriptions with complete data`
    );
    return NextResponse.json({ subscriptions: validSubscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Error code:", error.code);
      console.error("Error metadata:", error.meta);
    }
    return new NextResponse("Internal error", { status: 500 });
  }
}
