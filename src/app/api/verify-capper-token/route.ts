import { NextResponse } from "next/server";
import { verifyJWT } from "@/utils/jwt";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    await verifyJWT(token);

    return NextResponse.json({ valid: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
}
