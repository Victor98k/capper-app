import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");

    // If email is provided, check if user is a capper
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          isCapper: true,
        },
      });

      return NextResponse.json({
        isCapper: Boolean(user?.isCapper),
      });
    }

    // Get all cappers with their associated user info
    const cappers = await prisma.capper.findMany({
      where: {
        user: {
          id: { not: undefined },
        },
      },
      select: {
        id: true,
        userId: true,
        bio: true,
        tags: true,
        profileImage: true,
        imageUrl: true,
        socialLinks: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!cappers) {
      return NextResponse.json([]);
    }

    // Map the data to match the expected Capper type in the frontend
    const formattedCappers = cappers.map((capper) => ({
      id: capper.id,
      userId: capper.userId,
      bio: capper.bio,

      user: {
        firstName: capper.user.firstName,
        lastName: capper.user.lastName,
        username: capper.user.username,
      },
      profileImage: capper.profileImage,
      imageUrl: capper.imageUrl || undefined,
      tags: capper.tags || [],
      socialLinks: capper.socialLinks || {},
    }));

    return NextResponse.json(formattedCappers);
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
