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

// Endpoint to update capper BIO
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { userId, bio } = data;

    if (!userId || bio === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First find the capper record
    const capper = await prisma.capper.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!capper) {
      return NextResponse.json(
        { error: "Capper profile not found" },
        { status: 404 }
      );
    }

    const updatedCapper = await prisma.capper.update({
      where: {
        id: capper.id, // Use the capper's ID, not userId
      },
      data: {
        bio: bio,
      },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Update bio error:", error);
    return NextResponse.json(
      { error: "Failed to update capper bio" },
      { status: 500 }
    );
  }
}
