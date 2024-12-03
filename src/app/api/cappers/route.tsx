import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cappers = await prisma.capper.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { subscribers: true },
        },
      },
    });

    return NextResponse.json(cappers);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch cappers" },
      { status: 500 }
    );
  }
}
