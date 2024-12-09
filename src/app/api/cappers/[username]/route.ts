import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Define the correct type for the params
type Props = {
  params: {
    username: string;
  };
};

// Update the GET function to use the correct type
export async function GET(request: Request, { params }: Props) {
  try {
    const { username } = params;

    const capper = await prisma.capper.findFirst({
      where: {
        user: {
          username: username,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    if (!capper) {
      return NextResponse.json({ error: "Capper not found" }, { status: 404 });
    }

    return NextResponse.json(capper);
  } catch (error) {
    console.error("Error fetching capper:", error);
    return NextResponse.json(
      { error: "Failed to fetch capper" },
      { status: 500 }
    );
  }
}
