import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  // Your handler code here
  return NextResponse.json({
    /* your response */
  });
}

// Add other HTTP methods as needed (POST, PUT, DELETE, etc.)
