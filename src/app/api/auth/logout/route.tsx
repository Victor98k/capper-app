import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Clear the cookies
  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  response.cookies.set("isCapper", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
