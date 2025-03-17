import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/utils/jwt";

export async function middleware(request: NextRequest) {
  // Add logging to verify middleware behavior
  console.log("Middleware path check:", {
    path: request.nextUrl.pathname,
    isWebhook: request.nextUrl.pathname.startsWith("/api/webhooks/stripe"),
  });

  // Skip middleware for Stripe webhook requests
  if (request.nextUrl.pathname.startsWith("/api/webhooks/stripe")) {
    console.log("Skipping middleware for webhook request");
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  try {
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export const config = {
  matcher: [
    "/api/stripe/connect/:path*",
    "/api/stripe/products/:path*",
    "/api/stripe/:path*",
    // Exclude webhook path from middleware
    "/((?!api/webhooks/stripe).*)",
  ],
};
