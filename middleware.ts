import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/utils/jwt";

export async function middleware(request: NextRequest) {
  // Skip middleware for Stripe webhook requests
  if (request.nextUrl.pathname === "/api/webhooks/stripe") {
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
    // Remove this problematic catch-all pattern that might be affecting the webhook
    // "/((?!api/webhooks/stripe).*)",
  ],
};
