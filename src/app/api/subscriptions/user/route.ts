import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const userId = req.headers.get("userId");
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: userId,
      },
      include: {
        capper: {
          include: {
            user: {
              select: {
                username: true,
                // imageUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
