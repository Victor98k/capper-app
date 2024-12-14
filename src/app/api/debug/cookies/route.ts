import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cookies = request.cookies.getAll();
  const cookieHeader = request.headers.get("cookie");

  return NextResponse.json({
    cookies,
    cookieHeader,
    tokenCookie: request.cookies.get("token"),
  });
}
