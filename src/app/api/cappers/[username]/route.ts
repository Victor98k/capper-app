import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

type Props = {
  params: { username: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function GET(request: NextRequest, props: Props) {
  try {
    const { username } = props.params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

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
