import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    // Get all cappers with their associated user info
    const cappers = await prisma.capper.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // If email is provided, check if this user is a capper
    if (email) {
      const isCapper = cappers.some((capper) => capper.user.email === email);
      return NextResponse.json({ isCapper });
    }

    // Otherwise return all cappers (existing functionality)
    return NextResponse.json(cappers);
  } catch (error) {
    console.error("Error in cappers route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, bio } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updatedCapper = await prisma.capper.update({
      where: { userId: userId },
      data: { bio },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Error updating capper profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tagToRemove } = body;

    if (!userId || !tagToRemove) {
      return NextResponse.json(
        { error: "User ID and tag are required" },
        { status: 400 }
      );
    }

    const capper = await prisma.capper.findUnique({
      where: { userId },
      select: { tags: true },
    });

    if (!capper) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    const updatedTags = capper.tags.filter((tag) => tag !== tagToRemove);

    const updatedCapper = await prisma.capper.update({
      where: { userId },
      data: { tags: updatedTags },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Error removing tag:", error);
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tags } = body;

    if (!userId || !tags?.length) {
      return NextResponse.json(
        { error: "User ID and tags are required" },
        { status: 400 }
      );
    }

    const capper = await prisma.capper.findUnique({
      where: { userId },
      select: { tags: true },
    });

    if (!capper) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    const updatedTags = [...new Set([...capper.tags, ...tags])];

    const updatedCapper = await prisma.capper.update({
      where: { userId },
      data: { tags: updatedTags },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Error adding tags:", error);
    return NextResponse.json({ error: "Failed to add tags" }, { status: 500 });
  }
}
