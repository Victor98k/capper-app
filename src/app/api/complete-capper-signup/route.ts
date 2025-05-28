import { NextResponse } from "next/server";
import { verifyJWT } from "@/utils/jwt";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/utils/bcrypt";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Verify token and get payload
    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        capperProfile: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hashedPassword = await hashPassword(password);

    // Use transaction to ensure both operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: payload.userId },
        data: {
          password: hashedPassword,
          isCapper: true,
        },
      });

      // Create capper record if it doesn't exist
      if (!existingUser.capperProfile) {
        await tx.capper.create({
          data: {
            userId: payload.userId,
            bio: "",
            tags: [],
            subscriberIds: [],
            socialLinks: {},
          },
        });
      }
    });

    // Verify creation was successful
    const verifyCreation = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        capperProfile: true,
      },
    });

    if (!verifyCreation?.capperProfile) {
      return NextResponse.json(
        { error: "Failed to create capper profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing capper signup:", error);
    return NextResponse.json(
      { error: "Failed to complete signup" },
      { status: 500 }
    );
  }
}
