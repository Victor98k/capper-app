import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userId = req.headers.get("userId");
    console.log("Received request for user subscriptions:", userId);

    if (!userId) {
      console.log("No userId in headers");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: userId,
        status: "active", // Only get active subscriptions
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        capper: {
          include: {
            user: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    console.log("Found subscriptions:", subscriptions.length);
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
