import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    const capper = await prisma.capper.findFirst({
      where: {
        user: {
          username: username,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    if (!capper) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    return NextResponse.json(capper);
  } catch (error) {
    console.error("Error fetching capper:", error);
    return NextResponse.json(
      { error: "Failed to fetch capper" },
      { status: 500 }
    );
  }
}
