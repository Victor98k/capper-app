import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyJWT } from "@/utils/jwt";

export async function GET(req: Request) {
  try {
    // Get token from cookies
    const cookies = req.headers.get("cookie");
    const cookiesArray =
      cookies?.split(";").map((cookie) => cookie.trim()) || [];
    const tokenCookie = cookiesArray.find((cookie) =>
      cookie.startsWith("token=")
    );
    const token = tokenCookie?.split("=")[1];

    if (!token) {
      return NextResponse.json({ isSubscribed: false }, { status: 200 });
    }

    // Verify token and get userId
    const payload = await verifyJWT(token);
    if (!payload?.userId) {
      return NextResponse.json({ isSubscribed: false }, { status: 200 });
    }

    // Get capperId from query params
    const { searchParams } = new URL(req.url);
    const capperId = searchParams.get("capperId");

    if (!capperId) {
      return NextResponse.json(
        { error: "Capper ID is required" },
        { status: 400 }
      );
    }

    // Check if subscription exists
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: payload.userId,
        capperId: capperId,
        status: "active",
      },
    });

    return NextResponse.json({
      isSubscribed: !!subscription,
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}
