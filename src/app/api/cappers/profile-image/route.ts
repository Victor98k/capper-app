import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId, imageUrl } = await request.json();

    if (!userId || !imageUrl) {
      return NextResponse.json(
        { error: "User ID and image URL are required" },
        { status: 400 }
      );
    }

    const updatedCapper = await prisma.capper.update({
      where: { userId },
      data: {
        profileImage: imageUrl,
        imageUrl: imageUrl, // Update both fields if needed
      },
    });

    return NextResponse.json(updatedCapper);
  } catch (error) {
    console.error("Error updating profile image:", error);
    return NextResponse.json(
      { error: "Failed to update profile image" },
      { status: 500 }
    );
  }
}
