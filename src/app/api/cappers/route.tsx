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

// Endpoint to update capper BIO and username
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { userId, bio, username } = data;

    if (!userId) {
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
      include: {
        user: true,
      },
    });

    if (!capper) {
      return NextResponse.json(
        { error: "Capper profile not found" },
        { status: 404 }
      );
    }

    // If username is provided, check if it's unique
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: {
          username: username,
          NOT: {
            id: userId,
          },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }
    }

    // Update both user and capper
    const [updatedUser, updatedCapper] = await prisma.$transaction([
      prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...(username && { username }),
        },
      }),
      prisma.capper.update({
        where: {
          id: capper.id,
        },
        data: {
          ...(bio !== undefined && { bio }),
        },
      }),
    ]);

    return NextResponse.json({ user: updatedUser, capper: updatedCapper });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

// Endpoint to add tags to a capper
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, tags } = data;

    if (!userId || !Array.isArray(tags)) {
      return NextResponse.json(
        { error: "Missing required fields or invalid tags format" },
        { status: 400 }
      );
    }

    // Find the capper record
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

    // Update the capper's tags
    const updatedCapper = await prisma.capper.update({
      where: {
        id: capper.id,
      },
      data: {
        tags: {
          push: tags, // Add new tags to the existing array
        },
      },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Add tags error:", error);
    return NextResponse.json(
      { error: "Failed to add tags to capper" },
      { status: 500 }
    );
  }
}

// New endpoint to delete a tag
export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { userId, tagToRemove } = data;

    if (!userId || !tagToRemove) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the capper record
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

    // Filter out the tag to remove
    const updatedTags = capper.tags.filter((tag) => tag !== tagToRemove);

    // Update the capper's tags
    const updatedCapper = await prisma.capper.update({
      where: {
        id: capper.id,
      },
      data: {
        tags: updatedTags,
      },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Delete tag error:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
