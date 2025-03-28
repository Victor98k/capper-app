import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export async function DELETE(request: NextRequest) {
  try {
    // Get the token from the Authorization header
    const token = request.headers.get("Authorization")?.split("Bearer ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get userId from the request
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Start a transaction to ensure all related data is deleted
    await prisma.$transaction(async (prisma) => {
      // 1. Delete all subscriptions
      await prisma.subscription.deleteMany({
        where: { userId: userId },
      });

      // 2. Delete capper profile
      await prisma.capper.deleteMany({
        where: { userId: userId },
      });

      // 3. Delete likes
      //   await prisma.like.deleteMany({
      //     where: { userId: userId },
      //   });

      // 4. Delete posts
      //   await prisma.post.deleteMany({
      //     where: { capperId: userId },
      //   });

      // 5. Delete user
      await prisma.user.delete({
        where: { id: userId },
      });
    });

    return NextResponse.json(
      { message: "Account successfully deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
