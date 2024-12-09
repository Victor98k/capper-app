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
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(cappers);
  } catch (error) {
    console.error("Error fetching cappers:", error);
    return NextResponse.json(
      { error: "Failed to fetch cappers" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { userId, tagToRemove } = body;

    if (!userId || !tagToRemove) {
      return NextResponse.json(
        { error: "User ID and tag are required" },
        { status: 400 }
      );
    }

    // First get the current capper to access their tags
    const capper = await prisma.capper.findUnique({
      where: { userId },
      select: { tags: true },
    });

    if (!capper) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    // Filter out the tag to remove
    const updatedTags = capper.tags.filter((tag) => tag !== tagToRemove);

    // Update the capper with the new tags array
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, tags } = body;

    if (!userId || !tags?.length) {
      return NextResponse.json(
        { error: "User ID and tags are required" },
        { status: 400 }
      );
    }

    // Get current capper to access existing tags
    const capper = await prisma.capper.findUnique({
      where: { userId },
      select: { tags: true },
    });

    if (!capper) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    // Add new tags to existing tags array
    const updatedTags = [...new Set([...capper.tags, ...tags])];

    // Update the capper with the new tags array
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
