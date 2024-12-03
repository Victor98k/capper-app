import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId, capperId } = await request.json();

    const subscription = await prisma.user.update({
      where: { id: userId },
      data: {
        subscribedToIds: {
          push: capperId,
        },
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
