import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const { productId } = params;

  return NextResponse.json({
    productId,
  });
}

// Add other HTTP methods as needed (POST, PUT, DELETE, etc.)
